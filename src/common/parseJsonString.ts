import { ParseError } from "@core/errors/ParseError";
import { Result, fromThrowable } from "neverthrow";
import { z } from "zod";

export function parseJsonString<TSchema extends z.ZodSchema>(
  jsonString: string,
  schema: TSchema,
): Result<z.infer<TSchema>, ParseError> {
  return fromThrowable(
    () => schema.parse(JSON.parse(jsonString)),
    (error) => new ParseError("Failed to parse JSON string", error instanceof Error ? error : undefined),
  )();
}
