import { z } from "zod";

export const ProgressState = z.enum(["GENERATING_QUOTE", "GENERATING_SPEECH", "RENDERING_VIDEO", "DONE", "ERROR"]);

export const Progress = z.object({
  state: ProgressState,
  progress: z.number().min(0).max(1).describe("Progress of the overall process (from 0 to 1)"),
});

export type ProgressState = z.infer<typeof ProgressState>;
export type Progress = z.infer<typeof Progress>;
