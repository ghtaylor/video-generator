import { ServiceError } from "@core/errors/ServiceError";
import { ProgressReporter } from "@core/progressReporter";
import { ResultAsync } from "neverthrow";

export class OnErrorUseCase {
  constructor(private readonly progressReporter: ProgressReporter) {}

  execute(executionId: string): ResultAsync<null, ServiceError> {
    return this.progressReporter.reportProgress({ executionId, state: "ERROR", progress: 1 }).map(() => null);
  }
}
