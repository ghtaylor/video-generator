import { z } from "zod";
import { GenerateQuoteParams } from "./Quote";
import { VideoConfig } from "./Video";

export const ExecutionParams = z.object({
  quoteParams: GenerateQuoteParams,
  videoConfig: VideoConfig,
});

export const ExecutionStatus = z.enum([
  "STARTED",
  "GENERATING_QUOTE",
  "GENERATING_SPEECH",
  "RENDERING_VIDEO",
  "DONE",
  "ERROR",
]);

export const Execution = z.object({
  id: z.string(),
  status: ExecutionStatus,
  progress: z.number().min(0).max(1).optional().describe("Progress of the overall process (from 0 to 1)"),
});

export type ExecutionParams = z.infer<typeof ExecutionParams>;
export type ExecutionStatus = z.infer<typeof ExecutionStatus>;
export type Execution = z.infer<typeof Execution>;
