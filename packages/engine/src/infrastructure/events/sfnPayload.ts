import { z } from "zod";

export const BaseSFNPayload = z.object({
  executionId: z.string(),
});

export const ErrorSFNPayload = BaseSFNPayload.extend({
  cause: z.object({
    errorType: z.string(),
    errorMessage: z.string(),
  }),
});

export type BaseSFNPayload = z.infer<typeof BaseSFNPayload>;
