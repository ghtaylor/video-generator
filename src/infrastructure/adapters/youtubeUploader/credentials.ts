import { z } from "zod";

export const YoutubeCredentials = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  refreshToken: z.string(),
});

export type YoutubeCredentials = z.infer<typeof YoutubeCredentials>;
