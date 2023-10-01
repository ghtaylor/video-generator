import { Result, Unit } from "true-myth";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export interface Queue<TMessage> {
  enqueue(message: TMessage): Promise<Result<Unit, NetworkError | UnknownError>>;
}
