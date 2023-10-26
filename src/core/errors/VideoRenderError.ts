export class VideoRenderError extends Error {
  readonly name = "VideoRenderError";

  constructor(message: string, originalError?: Error) {
    super(originalError ? `${message}: ${originalError.message}` : message);

    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}
