import { FilePath } from "./File";
import { z } from "zod";

export const VideoMetadata = z.object({
  title: z.string(),
  description: z.string(),
});

export const VideoResourcePaths = z.object({
  backgroundVideoPaths: z.array(FilePath),
  musicAudioPath: FilePath.optional(),
  speechAudioPath: FilePath,
});

export const VideoResourceUrls = z.object({
  backgroundVideoUrls: z.array(z.string().url()),
  musicAudioUrl: z.string().url().optional(),
  speechAudioUrl: z.string().url(),
});

export const VideoConfig = z
  .object({
    fps: z.number(),
  })
  .merge(VideoResourcePaths.pick({ backgroundVideoPaths: true, musicAudioPath: true }));

export const VideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
  backgroundVideoUrl: z.string().url(),
});

export const RenderVideoParams = z.object({
  fps: z.number(),
  musicAudioUrl: z.string().url().optional(),
  speechAudioUrl: z.string().url(),
  sections: z.array(VideoSection),
  metadata: VideoMetadata,
});

export const RenderedVideo = z.object({
  videoPath: z.string(),
  metadata: VideoMetadata,
});

export type VideoMetadata = z.infer<typeof VideoMetadata>;
export type VideoResourcePaths = z.infer<typeof VideoResourcePaths>;
export type VideoResourceUrls = z.infer<typeof VideoResourceUrls>;
export type VideoConfig = z.infer<typeof VideoConfig>;
export type VideoSection = z.infer<typeof VideoSection>;
export type RenderVideoParams = z.infer<typeof RenderVideoParams>;
export type RenderedVideo = z.infer<typeof RenderedVideo>;
