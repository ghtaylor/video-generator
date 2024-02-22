import { EngineProgress } from "@video-generator/domain/Engine";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";

export interface ProgressReporter {
  reportProgress(progress: EngineProgress): ResultAsync<EngineProgress, ServiceError>;
}
