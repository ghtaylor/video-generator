import { SSTConfig } from "sst";
import { CommonStack } from "./stacks/CommonStack";
import { EngineStack } from "./stacks/EngineStack";
import { VideoStack } from "./stacks/VideoStack";

export default {
  config() {
    return {
      name: "video-generator",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(CommonStack);
    app.stack(VideoStack);
    app.stack(EngineStack);
  },
} satisfies SSTConfig;
