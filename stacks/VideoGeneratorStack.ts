import { Bucket, Config, Function, Queue, StackContext } from "sst/constructs";

export function VideoGeneratorStack({ stack }: StackContext) {
  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");

  const bucket = new Bucket(stack, "Bucket");

  const quoteQueue = new Queue(stack, "Quotes");
  const spokenQuoteQueue = new Queue(stack, "SpokenQuotes");
  const createVideoQueue = new Queue(stack, "CreateVideos");

  const generateQuoteFunction = new Function(stack, "GenerateQuote", {
    handler: "src/infrastructure/handlers/generateQuote.default",
    bind: [OPENAI_API_KEY, quoteQueue],
    timeout: "30 seconds",
  });

  const generateSpokenQuoteFunction = new Function(stack, "GenerateSpokenQuote", {
    handler: "src/infrastructure/handlers/generateSpokenQuote.default",
    bind: [spokenQuoteQueue, bucket],
    permissions: ["polly:SynthesizeSpeech"],
  });

  const generateVideoOptionsFunction = new Function(stack, "GenerateVideoOptions", {
    handler: "src/infrastructure/handlers/generateVideoOptions.default",
    bind: [bucket, createVideoQueue],
  });

  quoteQueue.addConsumer(stack, generateSpokenQuoteFunction);
  spokenQuoteQueue.addConsumer(stack, generateVideoOptionsFunction);
}
