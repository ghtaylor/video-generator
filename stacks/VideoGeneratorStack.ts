import { Bucket, Config, Function, Queue, StackContext, StaticSite } from "sst/constructs";
import { Duration } from "aws-cdk-lib";

export function VideoGeneratorStack({ stack }: StackContext) {
  const remotionApp = new StaticSite(stack, "RemotionApp", {
    path: "src/core/video",
    buildOutput: "../../../remotion-build",
    buildCommand: "npm run build:remotion",
    dev: {
      deploy: true,
    },
  });

  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");

  const bucket = new Bucket(stack, "Bucket");

  const quoteQueue = new Queue(stack, "QuoteQueue");
  const spokenQuoteQueue = new Queue(stack, "SpokenQuoteQueue");
  const renderVideoQueue = new Queue(stack, "RenderVideoQueue", {
    cdk: {
      queue: {
        visibilityTimeout: Duration.minutes(15),
      },
    },
  });

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
    bind: [bucket, renderVideoQueue],
  });

  const renderVideoFunction = new Function(stack, "RenderVideo", {
    handler: "src/infrastructure/handlers/renderVideo.default",
    bind: [bucket, remotionApp],
    retryAttempts: 0,
    architecture: "arm_64",
    runtime: "nodejs18.x",
    timeout: "15 minutes",
    memorySize: "2 GB",
    layers: ["arn:aws:lambda:eu-west-1:678892195805:layer:remotion-binaries-chromium-arm64:12"],
    copyFiles: [{ from: "node_modules/@remotion/compositor-linux-arm64-gnu" }],
    environment: {
      READ_ONLY_FS: "true",
      CHROMIUM_EXECUTABLE_PATH: "/opt/bin/chromium",
    },
    nodejs: {
      esbuild: {
        keepNames: false,
        external: ["@remotion/compositor-*"],
      },
    },
  });

  quoteQueue.addConsumer(stack, generateSpokenQuoteFunction);
  spokenQuoteQueue.addConsumer(stack, generateVideoOptionsFunction);
  renderVideoQueue.addConsumer(stack, renderVideoFunction);
}
