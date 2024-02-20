import { Progress } from "@video-generator/domain/Progress";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";

export interface ProgressReporter {
  reportProgress(progress: Progress): ResultAsync<Progress, ServiceError>;
}
