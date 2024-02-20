import { z } from "zod";

export const Progress = z.object({
  state: z.enum(["GENERATING_QUOTE", "GENERATING_SPEECH", "RENDERING_VIDEO", "DONE", "ERROR"]),
  progress: z.number().min(0).max(1).describe("Progress of the overall process (from 0 to 1)"),
});

export type Progress = z.infer<typeof Progress>;
