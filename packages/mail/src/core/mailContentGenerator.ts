import { MailContent } from "@video-generator/domain/Mail";
import { Result } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";
import { Execution, ExecutionStatus } from "@video-generator/domain/Execution";

export interface MailContentGenerator<TExecutionStatus extends ExecutionStatus> {
  mailContentFrom(execution: Extract<Execution, { status: TExecutionStatus }>): Result<MailContent, ServiceError>;
}

export interface MailContentGeneratorFactory {
  create<TExecutionStatus extends ExecutionStatus>(
    executionStatus: TExecutionStatus,
  ): Result<MailContentGenerator<TExecutionStatus> | null, never>;
}
