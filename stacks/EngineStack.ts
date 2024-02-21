import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Bucket, Config, Function, StackContext, use } from "sst/constructs";
import { CommonStack } from "./CommonStack";
import { VideoStack } from "./VideoStack";

export function EngineStack({ stack }: StackContext) {
  const ENGINE_DIR = "packages/engine";

  const { videoSite } = use(VideoStack);
  const { eventBus } = use(CommonStack);

  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const ELEVEN_LABS_CONFIG = new Config.Secret(stack, "ELEVEN_LABS_CONFIG");
  const VIDEO_CONFIG = new Config.Secret(stack, "VIDEO_CONFIG");

  const bucket = new Bucket(stack, "Bucket");

  const generateQuoteFunction = new Function(stack, "GenerateQuote", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateQuote.default`,
    bind: [OPENAI_API_KEY, eventBus],
    timeout: "30 seconds",
  });

  const generateSpokenQuoteFunction = new Function(stack, "GenerateSpokenQuote", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateSpokenQuote.default`,
    bind: [bucket, eventBus, ELEVEN_LABS_CONFIG],
    timeout: "30 seconds",
    // Required for Polly
    // permissions: ["polly:SynthesizeSpeech"],
  });

  const generateRenderVideoParamsFunction = new Function(stack, "GenerateRenderVideoParams", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateRenderVideoParams.default`,
    bind: [bucket, VIDEO_CONFIG],
  });

  const renderVideoFunction = new Function(stack, "RenderVideo", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/renderVideo.default`,
    bind: [bucket, eventBus, videoSite],
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

  const onDoneFunction = new Function(stack, "OnDone", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/onDone.default`,
    bind: [eventBus],
  });

  const onErrorFunction = new Function(stack, "OnError", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/onError.default`,
    bind: [eventBus],
  });

  const generateQuoteTask = new tasks.LambdaInvoke(stack, "GenerateQuoteTask", {
    lambdaFunction: generateQuoteFunction,
    inputPath: "$.quoteParams",
    resultSelector: {
      data: sfn.JsonPath.objectAt("$.Payload"),
    },
    resultPath: "$.quote",
  }).addRetry({ errors: ["QuoteChunksInvalidError"], maxAttempts: 2 });

  const generateSpokenQuoteTask = new tasks.LambdaInvoke(stack, "GenerateSpokenQuoteTask", {
    lambdaFunction: generateSpokenQuoteFunction,
    inputPath: "$.quote.data",
    resultSelector: {
      data: sfn.JsonPath.objectAt("$.Payload"),
    },
    resultPath: "$.spokenQuote",
  });

  const generateRenderVideoParamsTask = new tasks.LambdaInvoke(stack, "GenerateRenderVideoParamsTask", {
    lambdaFunction: generateRenderVideoParamsFunction,
    payload: sfn.TaskInput.fromObject({
      spokenQuote: sfn.JsonPath.objectAt("$.spokenQuote.data"),
      videoConfig: sfn.JsonPath.objectAt("$.videoConfig"),
    }),
    resultSelector: {
      data: sfn.JsonPath.objectAt("$.Payload"),
    },
    resultPath: "$.renderVideoParams",
  });

  const renderVideoTask = new tasks.LambdaInvoke(stack, "RenderVideoTask", {
    lambdaFunction: renderVideoFunction,
    inputPath: "$.renderVideoParams.data",
    resultSelector: {
      data: sfn.JsonPath.objectAt("$.Payload"),
    },
    resultPath: "$.renderedVideo",
  });

  const onErrorTask = new tasks.LambdaInvoke(stack, "OnErrorTask", {
    lambdaFunction: onErrorFunction,
  });

  const onDoneTask = new tasks.LambdaInvoke(stack, "OnDoneTask", {
    lambdaFunction: onDoneFunction,
  });

  const engineBlock = new sfn.Parallel(stack, "EngineBlock")
    .branch(generateQuoteTask.next(generateSpokenQuoteTask).next(generateRenderVideoParamsTask).next(renderVideoTask))
    .addCatch(onErrorTask)
    .next(onDoneTask);

  new sfn.StateMachine(stack, "Engine", {
    definitionBody: sfn.DefinitionBody.fromChainable(engineBlock),
  });

  eventBus.addRules(stack, {
    progressReportedRule: {
      pattern: {
        detailType: ["progressReported"],
      },
    },
  });

  eventBus.addTargets(stack, "progressReportedRule", {
    target1: onErrorFunction,
  });
}
