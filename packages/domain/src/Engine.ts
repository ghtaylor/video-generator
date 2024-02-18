import { z } from "zod";
import { GenerateQuoteParams } from "./Quote";
import { VideoConfig } from "./Video";

export const ExecuteEngineParams = z.object({
  quoteParams: GenerateQuoteParams,
  videoConfig: VideoConfig,
});

export type ExecuteEngineParams = z.infer<typeof ExecuteEngineParams>;
