export interface Logger {
  info(message: string): this;
  error(error: Error): this;
}
