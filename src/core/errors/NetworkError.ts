export class NetworkError extends Error {
  name = "NetworkError";
  constructor(message?: string) {
    super(message);
  }
}
