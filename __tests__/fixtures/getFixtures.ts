import path from "path";
import fs from "fs";

export function fixtureFrom(fixturePath: string): string {
  const absolutePath = path.resolve(__dirname, fixturePath);
  return fs.readFileSync(absolutePath, "utf-8");
}
