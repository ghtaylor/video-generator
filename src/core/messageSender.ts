import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";

export interface MessageSender<TMessage> {
  send(message: TMessage): ResultAsync<TMessage, NetworkError>;
}
