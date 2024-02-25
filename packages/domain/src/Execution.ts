import { z } from "zod";
import { GenerateQuoteParams } from "./Quote";
import { VideoConfig } from "./Video";

export const ExecutionParams = z.object({
  quoteParams: GenerateQuoteParams,
  videoConfig: VideoConfig,
});

export const ExecutionState = z.object({
  executionId: z.string().describe("The ID of the engine execution"),
  state: z.enum(["STARTED", "GENERATING_QUOTE", "GENERATING_SPEECH", "RENDERING_VIDEO", "DONE", "ERROR"]),
  progress: z.number().min(0).max(1).describe("Progress of the overall process (from 0 to 1)"),
});

export type ExecutionParams = z.infer<typeof ExecutionParams>;
export type ExecutionState = z.infer<typeof ExecutionState>;
