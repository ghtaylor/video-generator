import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export interface Queue<TMessage> {
  enqueue(message: TMessage): ResultAsync<TMessage, NetworkError | UnknownError>;
}
