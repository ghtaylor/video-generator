import { ServiceError } from "@core/errors/ServiceError";
import { FileStore } from "@core/fileStore";
import { MailContentGenerator, MailContentGeneratorFactory } from "@core/mailContentGenerator";
import { DoneExecution, ErrorExecution, ExecutionStatus } from "@video-generator/domain/Execution";
import { MailContent } from "@video-generator/domain/Mail";
import { Result, ok } from "neverthrow";

export class ReactDoneExecutionMailContentGenerator implements MailContentGenerator<"DONE"> {
  constructor(private readonly fileStore: FileStore) {}

  mailContentFrom(execution: DoneExecution): Result<MailContent, ServiceError> {
    return ok({
      subject: "Your video is ready!",
      body: `Your video is ready! You can download it from this link: ${execution.id}`,
    });
  }
}

export class ReactErrorExecutionMailContentGenerator implements MailContentGenerator<"ERROR"> {
  constructor(private readonly fileStore: FileStore) {}

  mailContentFrom(execution: ErrorExecution): Result<MailContent, ServiceError> {
    return ok({
      subject: "There was an error processing your video",
      body: `There was an error processing your video. Please check the logs for more information. ${execution.id}`,
    });
  }
}

export class ReactMailContentGeneratorFactory implements MailContentGeneratorFactory {
  constructor(private readonly fileStore: FileStore) {}

  create<TExecutionStatus extends ExecutionStatus>(
    executionStatus: TExecutionStatus,
  ): Result<MailContentGenerator<TExecutionStatus> | null, never> {
    switch (executionStatus) {
      case "DONE":
        return ok(new ReactDoneExecutionMailContentGenerator(this.fileStore) as MailContentGenerator<TExecutionStatus>);
      case "ERROR":
        return ok(
          new ReactErrorExecutionMailContentGenerator(this.fileStore) as MailContentGenerator<TExecutionStatus>,
        );
      default:
        return ok(null);
    }
  }
}
