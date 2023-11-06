import { z } from "zod";

export const VideoMetadata = z.object({
  title: z.string(),
  description: z.string(),
});

export const RenderVideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
  backgroundVideoUrl: z.string(),
});

export const RenderVideoParams = z.object({
  fps: z.number(),
  speechAudioUrl: z.string(),
  sections: z.array(RenderVideoSection),
  metadata: VideoMetadata,
});

export const UploadVideoParams = z.object({
  videoLocation: z.string(),
  metadata: VideoMetadata,
});

export type VideoMetadata = z.infer<typeof VideoMetadata>;
export type RenderVideoSection = z.infer<typeof RenderVideoSection>;
export type RenderVideoParams = z.infer<typeof RenderVideoParams>;
export type UploadVideoParams = z.infer<typeof UploadVideoParams>;
