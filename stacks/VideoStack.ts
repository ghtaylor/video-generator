import { StackContext, StaticSite } from "sst/constructs";

export function VideoStack({ stack }: StackContext) {
  const videoSite = new StaticSite(stack, "VideoSite", {
    path: "packages/video",
    buildOutput: "dist",
    buildCommand: "pnpm run build",
    dev: {
      deploy: true,
    },
  });

  return {
    videoSite,
  };
}
