import { useEffect, useRef, type RefObject } from 'react'
import { createFile, DataStream, Endianness } from 'mp4box'
import type { MP4BoxFile, MP4BoxInfo, MP4BoxSample, MP4BoxTrack } from '@/types/mp4box'

// Tuning constants — see project brief for rationale on each.
const LERP_TAU = 8 // smoothing rate for current -> target time
const SNAP = 0.002 // seconds; once this close, snap instead of continuing to ease
const LRU_MAX = 24 // max decoded ImageBitmaps kept resident at once
const LEAD = 24 // decoder queue depth we throttle chunk-feeding against
const WATCHDOG = 60000 // ms; if the frame bank isn't ready by then, give up on it

type ScrubMode = 'loading' | 'framebank' | 'fallback'

interface FrameBankEntry {
  timestamp: number // seconds
  blob: Blob
}

export interface VideoScrubHandle {
  /** Call once per animation frame with the current scroll progress (0-1) and delta seconds. */
  tick: (progress: number, dtSeconds: number) => void
}

/**
 * Drives a scroll-scrubbed hero video.
 *
 * Two rendering paths are maintained simultaneously:
 *  - A "frame bank" path: the source mp4 is parsed with mp4box, decoded
 *    frame-by-frame with WebCodecs, and each frame is cached as a small
 *    webp-encoded ImageBitmap. Scrubbing then paints the nearest cached
 *    frame onto a <canvas>, which is perfectly smooth and doesn't fight
 *    native <video> seek throttling.
 *  - A "fallback" path: if WebCodecs/mp4box/CORS aren't available, we
 *    simply set video.currentTime directly. Less smooth, but it always
 *    works, so the page can never end up blank.
 *
 * The caller (App) owns the single requestAnimationFrame loop and invokes
 * `tick()` every frame; this hook never runs rAF on its own so there is
 * only ever one animation loop driving the whole page.
 */
export function useVideoScrub(
  videoUrl: string,
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): VideoScrubHandle {
  const modeRef = useRef<ScrubMode>('loading')
  const durationRef = useRef(0)
  const currentTimeRef = useRef(0)
  const targetTimeRef = useRef(0)
  const paintedRef = useRef(false)
  const reducedMotionRef = useRef(false)

  const frameBankRef = useRef<FrameBankEntry[]>([])
  const lruRef = useRef<Map<number, ImageBitmap>>(new Map())
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // --- setup: video element, canvas, feature detection, frame-bank build ---
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    let cancelled = false
    let watchdogId: number | null = null

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = reducedMotionQuery.matches
    const onMotionChange = () => {
      reducedMotionRef.current = reducedMotionQuery.matches
    }
    reducedMotionQuery.addEventListener('change', onMotionChange)

    ctxRef.current = canvas.getContext('2d')
    canvas.style.opacity = '0'
    canvas.style.transition = 'opacity 300ms ease-out'

    const sizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = videoUrl

    const onLoadedMetadata = () => {
      durationRef.current = video.duration || 0
    }
    video.addEventListener('loadedmetadata', onLoadedMetadata)

    const fallBackToVideoSeek = () => {
      if (cancelled) return
      modeRef.current = 'fallback'
      if (watchdogId !== null) window.clearTimeout(watchdogId)
    }

    // Reduced motion: never spend the effort building a frame bank, and
    // scrub the video element directly with no easing.
    if (reducedMotionRef.current) {
      modeRef.current = 'fallback'
    } else if (
      typeof window.VideoDecoder === 'undefined' ||
      typeof window.EncodedVideoChunk === 'undefined'
    ) {
      // WebCodecs not supported at all.
      modeRef.current = 'fallback'
    } else {
      watchdogId = window.setTimeout(fallBackToVideoSeek, WATCHDOG)
      buildFrameBank(videoUrl, frameBankRef, LEAD)
        .then((durationHint) => {
          if (cancelled) return
          if (frameBankRef.current.length === 0) {
            fallBackToVideoSeek()
            return
          }
          if (durationHint && !durationRef.current) durationRef.current = durationHint
          modeRef.current = 'framebank'
          if (watchdogId !== null) window.clearTimeout(watchdogId)
        })
        .catch(() => {
          // Any failure anywhere in mp4box parsing, decoder configuration,
          // CORS-blocked fetch, etc. — the page must never go blank, so we
          // just fall back to letting the <video> element seek itself.
          fallBackToVideoSeek()
        })
    }

    return () => {
      cancelled = true
      if (watchdogId !== null) window.clearTimeout(watchdogId)
      window.removeEventListener('resize', sizeCanvas)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      reducedMotionQuery.removeEventListener('change', onMotionChange)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- plain mutable ref, not a DOM node; must read live .current, not a stale snapshot
      for (const bitmap of lruRef.current.values()) bitmap.close?.()
      lruRef.current.clear()
      frameBankRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl])

  const getOrDecode = (index: number): ImageBitmap | null => {
    const lru = lruRef.current
    const cached = lru.get(index)
    if (cached) {
      // bump recency
      lru.delete(index)
      lru.set(index, cached)
      return cached
    }
    const entry = frameBankRef.current[index]
    if (!entry) return null
    createImageBitmap(entry.blob)
      .then((bitmap) => {
        const map = lruRef.current
        map.set(index, bitmap)
        if (map.size > LRU_MAX) {
          const oldestKey = map.keys().next().value
          if (oldestKey !== undefined) {
            map.get(oldestKey)?.close?.()
            map.delete(oldestKey)
          }
        }
      })
      .catch(() => {
        /* frame will simply stay un-cached; next tick retries */
      })
    return null
  }

  const drawNearestFrame = (t: number) => {
    const bank = frameBankRef.current
    if (bank.length === 0) return
    const index = findNearestIndex(bank, t)
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    const bitmap = getOrDecode(index)
    if (bitmap && canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      if (!paintedRef.current) {
        paintedRef.current = true
        canvas.style.opacity = '1'
      }
    }
    // Warm neighbors slightly ahead so scrubbing forward stays smooth.
    for (const neighbor of [index - 1, index, index + 1, index + 2]) {
      if (neighbor >= 0 && neighbor < bank.length && !lruRef.current.has(neighbor)) {
        getOrDecode(neighbor)
      }
    }
  }

  const tick = (progress: number, dtSeconds: number) => {
    const mode = modeRef.current
    if (mode === 'loading') return

    const duration = durationRef.current || videoRef.current?.duration || 0
    targetTimeRef.current = progress * duration

    if (reducedMotionRef.current) {
      currentTimeRef.current = targetTimeRef.current
    } else {
      const dt = Math.min(0.1, dtSeconds)
      const current = currentTimeRef.current
      const target = targetTimeRef.current
      let next = current + (target - current) * (1 - Math.exp(-dt * LERP_TAU))
      if (Math.abs(target - next) < SNAP) next = target
      currentTimeRef.current = next
    }

    if (mode === 'framebank') {
      drawNearestFrame(currentTimeRef.current)
    } else {
      const video = videoRef.current
      if (video && Math.abs(video.currentTime - currentTimeRef.current) > 0.02) {
        try {
          video.currentTime = currentTimeRef.current
        } catch {
          /* seeking can throw before metadata is ready; ignore and retry next tick */
        }
      }
    }
  }

  return { tick }
}

function findNearestIndex(bank: FrameBankEntry[], t: number): number {
  let lo = 0
  let hi = bank.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (bank[mid].timestamp < t) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(bank[lo - 1].timestamp - t) <= Math.abs(bank[lo].timestamp - t)) {
    return lo - 1
  }
  return lo
}

/** Pulls the avcC/hvcC decoder-config bytes mp4box parsed out of the stsd box. */
function getCodecDescription(mp4boxFile: MP4BoxFile, trackId: number): Uint8Array | undefined {
  // mp4box's public types don't model the raw box tree, so this walk is
  // necessarily loosely typed. Any shape mismatch here is caught by the
  // caller and treated as "frame bank unavailable".
  const track = mp4boxFile.getTrackById(trackId) as {
    mdia: { minf: { stbl: { stsd: { entries: unknown[] } } } }
  }
  const entry = track.mdia.minf.stbl.stsd.entries[0] as Record<string, { write: (s: DataStream) => void } | undefined>
  const box = entry.avcC ?? entry.hvcC ?? entry.vpcC ?? entry.av1C
  if (!box) return undefined
  const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN)
  box.write(stream)
  // The written box includes an 8-byte size+fourcc header VideoDecoder
  // doesn't want as part of `description`.
  return new Uint8Array(stream.buffer, 8)
}

/**
 * Parses `url` with mp4box, decodes every video frame with WebCodecs, and
 * fills `frameBankRef` with timestamp-sorted, webp-encoded frame blobs.
 * Resolves the source duration (seconds) on success. Any failure — decoder
 * unsupported, CORS blocked, malformed file — rejects, and the caller
 * falls back to native <video> seeking.
 */
async function buildFrameBank(
  url: string,
  frameBankRef: RefObject<FrameBankEntry[]>,
  lead: number,
): Promise<number> {
  return runFrameBankAttempt(url, frameBankRef, lead, false).catch(() =>
    // One retry with software decoding, per the fallback ladder.
    runFrameBankAttempt(url, frameBankRef, lead, true),
  )
}

async function runFrameBankAttempt(
  url: string,
  frameBankRef: RefObject<FrameBankEntry[]>,
  lead: number,
  preferSoftware: boolean,
): Promise<number> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch video (${response.status})`)
  const buffer = await response.arrayBuffer()

  const mp4boxFile = createFile() as unknown as MP4BoxFile
  const bank: FrameBankEntry[] = []
  let resolvedDuration = 0

  await new Promise<void>((resolve, reject) => {
    let decoder: VideoDecoder | null = null
    let videoTrack: MP4BoxTrack | null = null
    const pendingFrames: Promise<void>[] = []
    let sampleFeedingDone = false

    mp4boxFile.onError = (error: string) => reject(new Error(error))

    mp4boxFile.onReady = (info: MP4BoxInfo) => {
      const track = info.videoTracks[0]
      if (!track) {
        reject(new Error('No video track found'))
        return
      }
      videoTrack = track
      resolvedDuration = info.duration / info.timescale

      let description: Uint8Array | undefined
      try {
        description = getCodecDescription(mp4boxFile, track.id)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to read codec description'))
        return
      }

      decoder = new VideoDecoder({
        output: (frame) => {
          const framePromise = encodeFrameToBank(frame, bank)
          pendingFrames.push(framePromise)
        },
        error: (err) => reject(err),
      })

      const config: VideoDecoderConfig = {
        codec: track.codec,
        codedWidth: track.video?.width,
        codedHeight: track.video?.height,
        description,
        hardwareAcceleration: preferSoftware ? 'prefer-software' : 'no-preference',
      }

      try {
        decoder.configure(config)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Unsupported decoder config'))
        return
      }

      mp4boxFile.setExtractionOptions(track.id, null, { nbSamples: 200 })
      mp4boxFile.start()
    }

    mp4boxFile.onSamples = (_trackId: number, _user: unknown, samples: MP4BoxSample[]) => {
      if (!decoder || !videoTrack) return
      void feedSamples(decoder, samples, lead)
        .then(() => {
          sampleFeedingDone = true
        })
        .catch(reject)
    }

    const finish = async () => {
      try {
        if (decoder && decoder.state !== 'closed') {
          await decoder.flush()
          decoder.close()
        }
        await Promise.all(pendingFrames)
        bank.sort((a, b) => a.timestamp - b.timestamp)
        resolve()
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to finalize frame bank'))
      }
    }

    // mp4box parses everything from a single appendBuffer call for a
    // non-fragmented mp4; poll briefly for the sample-feeding loop to
    // finish before flushing the decoder.
    const bufferWithStart = buffer as ArrayBuffer & { fileStart: number }
    bufferWithStart.fileStart = 0
    try {
      mp4boxFile.appendBuffer(bufferWithStart)
      mp4boxFile.flush()
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to parse mp4'))
      return
    }

    const waitForSampleFeeding = () => {
      if (sampleFeedingDone || !videoTrack) {
        void finish()
      } else {
        window.setTimeout(waitForSampleFeeding, 10)
      }
    }
    window.setTimeout(waitForSampleFeeding, 10)
  })

  frameBankRef.current = bank
  return resolvedDuration
}

async function encodeFrameToBank(frame: VideoFrame, bank: FrameBankEntry[]): Promise<void> {
  try {
    const width = frame.displayWidth
    const height = frame.displayHeight
    const offscreen = new OffscreenCanvas(width, height)
    const ctx = offscreen.getContext('2d')
    if (ctx) {
      ctx.drawImage(frame, 0, 0, width, height)
      const blob = await offscreen.convertToBlob({ type: 'image/webp', quality: 0.82 })
      bank.push({ timestamp: frame.timestamp / 1_000_000, blob })
    }
  } finally {
    frame.close()
  }
}

/** Feeds samples to the decoder, pausing while its internal queue is deep (throttled by LEAD). */
async function feedSamples(
  decoder: VideoDecoder,
  samples: MP4BoxSample[],
  lead: number,
): Promise<void> {
  for (const sample of samples) {
    while (decoder.decodeQueueSize >= lead) {
      await new Promise((r) => window.setTimeout(r, 4))
    }
    const chunk = new EncodedVideoChunk({
      type: sample.is_sync ? 'key' : 'delta',
      timestamp: (sample.cts * 1_000_000) / sample.timescale,
      duration: (sample.duration * 1_000_000) / sample.timescale,
      data: sample.data,
    })
    decoder.decode(chunk)
  }
}
