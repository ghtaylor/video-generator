import { z } from "zod";

export const VideoSection = z.object({
  text: z.string(),
  durationInFrames: z.number(),
  backgroundVideoLocation: z.string(),
});

export const VideoOptions = z.object({
  fps: z.number(),
  description: z.string(), // quote text and hashtags
  speechAudioLocation: z.string(),
  sections: z.array(VideoSection),
});

export type VideoSection = z.infer<typeof VideoSection>;
export type VideoOptions = z.infer<typeof VideoOptions>;
