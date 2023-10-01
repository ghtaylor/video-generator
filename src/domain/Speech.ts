import { z } from "zod";

export const Speech = z.object({
  text: z.string(),
  audioUrl: z.string().url(),
  marks: z.array(
    z.object({
      value: z.string(),
      start: z.number(),
      end: z.number(),
    }),
  ),
});

export type Speech = z.infer<typeof Speech>;
