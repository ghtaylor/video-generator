import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";

export interface Queue<TMessage> {
  enqueue(message: TMessage): ResultAsync<TMessage, NetworkError>;
}
