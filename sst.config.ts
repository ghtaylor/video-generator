import { SSTConfig } from "sst";
import { VideoGeneratorStack } from "./stacks/VideoGeneratorStack";

export default {
  config() {
    return {
      name: "video-generator",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(VideoGeneratorStack);
  },
} satisfies SSTConfig;
