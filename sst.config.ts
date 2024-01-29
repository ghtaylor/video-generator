import { SSTConfig } from "sst";
import { VideoStack } from "./stacks/VideoStack";
import { EngineStack } from "./stacks/EngineStack";

export default {
  config() {
    return {
      name: "video-generator",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(VideoStack);
    app.stack(EngineStack);
  },
} satisfies SSTConfig;
