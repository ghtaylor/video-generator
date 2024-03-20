import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Config, Function, StackContext, use } from "sst/constructs";
import { CommonStack } from "./CommonStack";
import { VideoStack } from "./VideoStack";

export function EngineStack({ stack }: StackContext) {
  const ENGINE_DIR = "packages/engine";

  const { videoSite } = use(VideoStack);
  const { eventBus, bucket } = use(CommonStack);

  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const ELEVEN_LABS_CONFIG = new Config.Secret(stack, "ELEVEN_LABS_CONFIG");
  const VIDEO_CONFIG = new Config.Secret(stack, "VIDEO_CONFIG");

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
    payload: sfn.TaskInput.fromObject({
      executionId: sfn.JsonPath.stringAt("$$.Execution.Name"),
      quoteParams: sfn.JsonPath.objectAt("$.quoteParams"),
    }),
    resultSelector: {
      data: sfn.JsonPath.objectAt("$.Payload"),
    },
    resultPath: "$.quote",
  }).addRetry({ errors: ["QuoteChunksInvalidError"], maxAttempts: 2 });

  const generateSpokenQuoteTask = new tasks.LambdaInvoke(stack, "GenerateSpokenQuoteTask", {
    lambdaFunction: generateSpokenQuoteFunction,
    payload: sfn.TaskInput.fromObject({
      executionId: sfn.JsonPath.stringAt("$$.Execution.Name"),
      quote: sfn.JsonPath.objectAt("$.quote.data"),
    }),
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
    payload: sfn.TaskInput.fromObject({
      executionId: sfn.JsonPath.stringAt("$$.Execution.Name"),
      renderVideoParams: sfn.JsonPath.objectAt("$.renderVideoParams.data"),
    }),
    resultSelector: {
      data: sfn.JsonPath.objectAt("$.Payload"),
    },
    resultPath: "$.renderedVideo",
  });

  const unwrapOutputPass = new sfn.Pass(stack, "UnwrapOutput", {
    inputPath: "$[0]",
  });

  const onErrorTask = new tasks.LambdaInvoke(stack, "OnErrorTask", {
    lambdaFunction: onErrorFunction,
    payload: sfn.TaskInput.fromObject({
      executionId: sfn.JsonPath.stringAt("$$.Execution.Name"),
      cause: sfn.JsonPath.stringToJson(sfn.JsonPath.stringAt("$.Cause")),
    }),
  });

  const onDoneTask = new tasks.LambdaInvoke(stack, "OnDoneTask", {
    lambdaFunction: onDoneFunction,
    payload: sfn.TaskInput.fromObject({
      executionId: sfn.JsonPath.stringAt("$$.Execution.Name"),
      renderedVideo: sfn.JsonPath.objectAt("$.renderedVideo.data"),
    }),
  });

  const engineBlock = new sfn.Parallel(stack, "EngineBlock")
    .branch(generateQuoteTask.next(generateSpokenQuoteTask).next(generateRenderVideoParamsTask).next(renderVideoTask))
    .addCatch(onErrorTask)
    .next(unwrapOutputPass)
    .next(onDoneTask);

  new sfn.StateMachine(stack, "Engine", {
    definitionBody: sfn.DefinitionBody.fromChainable(engineBlock),
  });

  eventBus.addRules(stack, {
    executionUpdated: {
      pattern: {
        detailType: ["executionUpdated"],
      },
    },
  });
}
