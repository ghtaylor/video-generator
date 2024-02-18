import { VideoConfig } from "./Video";
import { SpokenQuote } from "./Quote";
import { z } from "zod";

export const GenerateQUoteVideoParams = z.object({
  spokenQuote: SpokenQuote,
  videoConfig: VideoConfig,
});

export type GenerateQuoteVideoParams = z.infer<typeof GenerateQUoteVideoParams>;
