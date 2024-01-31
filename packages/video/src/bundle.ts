import { bundle } from "@remotion/bundler";
import { enableTailwind } from "@remotion/tailwind";
import path from "path";

async function main() {
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.ts"),
    webpackOverride: (config) => enableTailwind(config),
    outDir: path.resolve("./dist"),
  });

  console.log("Remotion bundle created at", bundleLocation);
}

main();
