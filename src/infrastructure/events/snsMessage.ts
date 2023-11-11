import { z } from "zod";

export const SNSMessage = z.object({
  Message: z.string(),
});

export type SNSMessage = z.infer<typeof SNSMessage>;
