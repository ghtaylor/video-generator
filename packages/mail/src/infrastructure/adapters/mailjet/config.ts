import { z } from "zod";

export const MailjetConfig = z.object({
  apiKey: z.string(),
  apiSecret: z.string(),
});

export type MailjetConfig = z.infer<typeof MailjetConfig>;
