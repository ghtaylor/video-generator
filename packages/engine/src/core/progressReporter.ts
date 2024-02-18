import { Progress, State } from "@video-generator/domain/Progress";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";

export interface ProgressReporter {
  reportProgress(state: State): ResultAsync<Progress, ServiceError>;
}
