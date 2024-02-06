import { Duration } from "aws-cdk-lib";
import { Bucket, Config, Function, Queue, StackContext, Topic, use } from "sst/constructs";
import { VideoStack } from "./VideoStack";

export function EngineStack({ stack }: StackContext) {
  const ENGINE_DIR = "packages/engine";

  const { videoSite } = use(VideoStack);

  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const YOUTUBE_CREDENTIALS = new Config.Secret(stack, "YOUTUBE_CREDENTIALS");
  const ELEVEN_LABS_CONFIG = new Config.Secret(stack, "ELEVEN_LABS_CONFIG");
  const VIDEO_CONFIG = new Config.Secret(stack, "VIDEO_CONFIG");

  const bucket = new Bucket(stack, "Bucket");

  const generateQuoteQueue = new Queue(stack, "GenerateQuoteQueue");
  const generateQuoteWithSpeechQueue = new Queue(stack, "GenerateQuoteWithSpeechQueue");
  const generateRenderVideoParamsQueue = new Queue(stack, "GenerateRenderVideoParamsQueue");
  const renderVideoQueue = new Queue(stack, "RenderVideoQueue", {
    cdk: {
      queue: {
        visibilityTimeout: Duration.minutes(15),
      },
    },
  });

  const uploadVideoToYoutubeQueue = new Queue(stack, "UploadVideoToYoutubeQueue");

  const uploadVideoTopic = new Topic(stack, "UploadVideoTopic", {
    subscribers: {
      youtubeQueueSubscriber: {
        type: "queue",
        queue: uploadVideoToYoutubeQueue,
      },
    },
  });

  const generateQuoteFunction = new Function(stack, "GenerateQuote", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateQuote.default`,
    bind: [OPENAI_API_KEY, generateQuoteWithSpeechQueue],
    timeout: "30 seconds",
  });

  const generateSpokenQuoteFunction = new Function(stack, "GenerateSpokenQuote", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateSpokenQuote.default`,
    bind: [generateRenderVideoParamsQueue, bucket, ELEVEN_LABS_CONFIG],
    timeout: "30 seconds",
    // Required for Polly
    // permissions: ["polly:SynthesizeSpeech"],
  });

  const generateRenderVideoParamsFunction = new Function(stack, "GenerateRenderVideoParams", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateRenderVideoParams.default`,
    bind: [bucket, renderVideoQueue, VIDEO_CONFIG],
  });

  const renderVideoFunction = new Function(stack, "RenderVideo", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/renderVideo.default`,
    bind: [bucket, videoSite, uploadVideoTopic],
    retryAttempts: 0,
    architecture: "arm_64",
    runtime: "nodejs18.x",
    timeout: "15 minutes",
    memorySize: "2 GB",
    layers: ["arn:aws:lambda:eu-west-1:678892195805:layer:remotion-binaries-chromium-arm64:12"],
    copyFiles: [{ from: `${ENGINE_DIR}/node_modules/@remotion/compositor-linux-arm64-gnu` }],
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

  const uploadVideoFunction = new Function(stack, "UploadVideo", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/uploadVideo.default`,
    bind: [YOUTUBE_CREDENTIALS, uploadVideoToYoutubeQueue, bucket],
  });

  generateQuoteQueue.addConsumer(stack, generateQuoteFunction);
  generateQuoteWithSpeechQueue.addConsumer(stack, generateSpokenQuoteFunction);
  generateRenderVideoParamsQueue.addConsumer(stack, generateRenderVideoParamsFunction);
  renderVideoQueue.addConsumer(stack, renderVideoFunction);
  uploadVideoToYoutubeQueue.addConsumer(stack, uploadVideoFunction);
}
