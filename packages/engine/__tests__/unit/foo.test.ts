import { Quote } from "@video-generator/domain/Quote";
import zodToJsonSchema from "zod-to-json-schema";

test("foo", () => {
  console.log(JSON.stringify(zodToJsonSchema(Quote)));
});
