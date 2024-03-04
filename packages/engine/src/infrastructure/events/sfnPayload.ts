import { z } from "zod";

export const BaseSFNPayload = z.object({
  id: z.string(),
});

export type BaseSFNPayload = z.infer<typeof BaseSFNPayload>;
