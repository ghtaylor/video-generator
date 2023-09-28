import { z } from "zod";

export const Quote = z.object({
  text: z.string(),
  chunks: z.array(z.string()),
});

export type Quote = z.infer<typeof Quote>;
