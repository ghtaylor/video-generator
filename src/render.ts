import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind";
import path from "path";

async function main() {
  // The composition you want to render
  const compositionId = "video";

  // You only have to create a bundle once, and you may reuse it
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });

  // Get the composition you want to render. Pass inputProps if you want to customize the
  // duration or other metadata.
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
  });

  // Render the video
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: `out/${compositionId}.mp4`,
    onProgress: ({ progress }) => {
      if (progress % 0.1 === 0) {
        console.log(`Progress: ${progress * 100}%`);
      }
    },
  });

  console.log("Render done!");
}

main().catch((err) => {
  console.error(err);
});
