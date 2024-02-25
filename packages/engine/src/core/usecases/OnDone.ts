import { ServiceError } from "@core/errors/ServiceError";
import { ExecutionManager } from "@core/executionManager";
import { ResultAsync } from "neverthrow";

export class OnDoneUseCase {
  constructor(private readonly executionManager: ExecutionManager) {}

  execute(executionId: string): ResultAsync<null, ServiceError> {
    return this.executionManager.reportState({ executionId, state: "DONE", progress: 1 }).map(() => null);
  }
}
