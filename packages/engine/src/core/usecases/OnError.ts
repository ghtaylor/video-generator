import { ServiceError } from "@core/errors/ServiceError";
import { ProgressReporter } from "@core/progressReporter";
import { ResultAsync } from "neverthrow";

export class OnErrorUseCase {
  constructor(private readonly progressReporter: ProgressReporter) {}

  execute(): ResultAsync<null, ServiceError> {
    return this.progressReporter.reportProgress({ state: "ERROR", progress: 1 }).map(() => null);
  }
}
