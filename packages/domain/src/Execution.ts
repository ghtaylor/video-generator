import { z } from "zod";
import { GenerateQuoteParams } from "./Quote";
import { RenderedVideo, VideoConfig } from "./Video";

export const ExecutionParams = z.object({
  quoteParams: GenerateQuoteParams,
  videoConfig: VideoConfig,
});

const BaseExecution = z.object({
  id: z.string(),
  progress: z.number().min(0).max(1).optional().describe("Progress of the overall process (from 0 to 1)"),
});

export const ExecutionErrorCause = z.object({
  type: z.string(),
  message: z.string(),
});

export const Execution = BaseExecution.and(
  z.discriminatedUnion("status", [
    z.object({
      status: z.enum(["STARTED", "GENERATING_QUOTE", "GENERATING_SPEECH", "RENDERING_VIDEO", "UNKNOWN"]),
    }),
    z.object({
      status: z.literal("DONE"),
      renderedVideo: RenderedVideo,
    }),
    z.object({
      status: z.literal("ERROR"),
      cause: ExecutionErrorCause,
    }),
  ]),
);

export type ExecutionParams = z.infer<typeof ExecutionParams>;
export type Execution = z.infer<typeof Execution>;
export type ExecutionErrorCause = z.infer<typeof ExecutionErrorCause>;
export type ExecutionStatus = Execution["status"];
