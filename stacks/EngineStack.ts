import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Bucket, Config, Function, StackContext, use } from "sst/constructs";
import { VideoStack } from "./VideoStack";

export function EngineStack({ stack }: StackContext) {
  const ENGINE_DIR = "packages/engine";

  const { videoSite } = use(VideoStack);

  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const ELEVEN_LABS_CONFIG = new Config.Secret(stack, "ELEVEN_LABS_CONFIG");
  const VIDEO_CONFIG = new Config.Secret(stack, "VIDEO_CONFIG");

  const bucket = new Bucket(stack, "Bucket");

  const generateQuoteFunction = new Function(stack, "GenerateQuote", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateQuote.default`,
    bind: [OPENAI_API_KEY],
    timeout: "30 seconds",
  });

  const generateSpokenQuoteFunction = new Function(stack, "GenerateSpokenQuote", {
    handler: `${ENGINE_DIR}/src/infrastructure/handlers/generateSpokenQuote.default`,
    bind: [bucket, ELEVEN_LABS_CONFIG],
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
    bind: [bucket, videoSite],
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

  const sGenerateQuote = new tasks.LambdaInvoke(stack, generateQuoteFunction.functionName, {
    lambdaFunction: generateQuoteFunction,
  });

  const sGenerateSpokenQuote = new tasks.LambdaInvoke(stack, generateSpokenQuoteFunction.functionName, {
    lambdaFunction: generateSpokenQuoteFunction,
    payload: sfn.TaskInput.fromJsonPathAt("$.Payload"),
  });

  const sGenerateRenderVideoParams = new tasks.LambdaInvoke(stack, generateRenderVideoParamsFunction.functionName, {
    lambdaFunction: generateRenderVideoParamsFunction,
    payload: sfn.TaskInput.fromJsonPathAt("$.Payload"),
  });

  const sRenderVideo = new tasks.LambdaInvoke(stack, renderVideoFunction.functionName, {
    lambdaFunction: renderVideoFunction,
    payload: sfn.TaskInput.fromJsonPathAt("$.Payload"),
  });

  new sfn.StateMachine(stack, "GenerateQuoteVideoMachine", {
    definitionBody: sfn.DefinitionBody.fromChainable(
      sGenerateQuote.next(sGenerateSpokenQuote).next(sGenerateRenderVideoParams).next(sRenderVideo),
    ),
  });
}
