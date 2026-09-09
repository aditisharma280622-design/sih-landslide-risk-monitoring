/**
 * mp4box ships its own generated .d.ts, but its type surface is huge and
 * mismatched with how the package is actually used at runtime (the real
 * ISOFile instance exposes plain callback properties like `onReady`,
 * `onSamples`, `onError` that aren't modeled cleanly by the generated
 * types). We only touch a small, stable slice of the API in
 * `useVideoScrub`, so we declare that slice explicitly here instead of
 * fighting the generated types.
 */

export interface MP4BoxSample {
  data: Uint8Array
  is_sync: boolean
  cts: number
  dts: number
  duration: number
  timescale: number
}

export interface MP4BoxTrack {
  id: number
  type: 'video' | 'audio' | 'text' | string
  codec: string
  video?: {
    width: number
    height: number
  }
  nb_samples: number
  timescale: number
}

export interface MP4BoxInfo {
  duration: number
  timescale: number
  tracks: MP4BoxTrack[]
  videoTracks: MP4BoxTrack[]
}

/** Subset of GPAC ISOFile actually used by the frame-bank builder. */
export interface MP4BoxFile {
  onReady?: (info: MP4BoxInfo) => void
  onSamples?: (trackId: number, user: unknown, samples: MP4BoxSample[]) => void
  onError?: (error: string) => void
  appendBuffer: (data: ArrayBuffer & { fileStart: number }) => void
  setExtractionOptions: (
    trackId: number,
    user?: unknown,
    options?: { nbSamples?: number },
  ) => void
  start: () => void
  stop: () => void
  flush: () => void
  /** Returns the raw avcC/hvcC description box needed to configure VideoDecoder. */
  getTrackById: (id: number) => unknown
}
