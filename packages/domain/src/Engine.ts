import { z } from "zod";
import { GenerateQuoteParams } from "./Quote";
import { VideoConfig } from "./Video";

export const ExecuteEngineParams = z.object({
  quoteParams: GenerateQuoteParams,
  videoConfig: VideoConfig,
});

export const EngineState = z.enum(["GENERATING_QUOTE", "GENERATING_SPEECH", "RENDERING_VIDEO", "DONE", "ERROR"]);

export const EngineProgress = z.object({
  state: EngineState,
  progress: z.number().min(0).max(1).describe("Progress of the overall process (from 0 to 1)"),
});

export type ExecuteEngineParams = z.infer<typeof ExecuteEngineParams>;
export type EngineState = z.infer<typeof EngineState>;
export type EngineProgress = z.infer<typeof EngineProgress>;
