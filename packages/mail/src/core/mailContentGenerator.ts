import { Execution, ExecutionStatus } from "@video-generator/domain/Execution";
import { MailContent } from "@video-generator/domain/Mail";
import { Result, ResultAsync } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";

export interface MailContentGenerator<TExecutionStatus extends ExecutionStatus> {
  mailContentFrom(execution: Extract<Execution, { status: TExecutionStatus }>): ResultAsync<MailContent, ServiceError>;
}

export interface MailContentGeneratorFactory {
  create<TExecutionStatus extends ExecutionStatus>(
    executionStatus: TExecutionStatus,
  ): Result<MailContentGenerator<TExecutionStatus> | null, never>;
}
