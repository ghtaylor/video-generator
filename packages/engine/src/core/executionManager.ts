import { ExecutionState } from "@video-generator/domain/Execution";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";

export interface ExecutionManager {
  reportState(state: ExecutionState): ResultAsync<ExecutionState, ServiceError>;
}
