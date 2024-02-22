import { z } from "zod";

export const BaseSFNPayload = z.object({
  executionId: z.string(),
});

export type BaseSFNPayload = z.infer<typeof BaseSFNPayload>;
