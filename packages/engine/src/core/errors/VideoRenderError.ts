import { BaseError, ErrorOptions } from "./BaseError";

export class VideoRenderError extends BaseError {
  readonly name = "VideoRenderError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
