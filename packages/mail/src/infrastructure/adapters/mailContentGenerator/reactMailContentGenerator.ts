import { ServiceError } from "@core/errors/ServiceError";
import { FileStore } from "@core/fileStore";
import { MailContentGenerator, MailContentGeneratorFactory } from "@core/mailContentGenerator";
import { render } from "@react-email/components";
import { DoneExecution, ErrorExecution, ExecutionStatus } from "@video-generator/domain/Execution";
import { MailContent } from "@video-generator/domain/Mail";
import { Result, ResultAsync, fromThrowable, ok } from "neverthrow";
import DoneExecutionEmail, { DONE_EXECUTION_EMAIL_SUBJECT } from "./DoneExecutionEmail";
import ErrorExecutionEmail, { ERROR_EXECUTION_EMAIL_SUBJECT } from "./ErrorExecutionEmail";

const safeRender = fromThrowable(
  render,
  (error) => new ServiceError("Failed to render email", { originalError: error }),
);

export class ReactDoneExecutionMailContentGenerator implements MailContentGenerator<"DONE"> {
  constructor(private readonly fileStore: FileStore) {}

  mailContentFrom(execution: DoneExecution): ResultAsync<MailContent, ServiceError> {
    return this.fileStore
      .getUrl(execution.renderedVideo.videoPath)
      .andThen((videoDownloadUrl) => safeRender(DoneExecutionEmail({ execution, videoDownloadUrl })))
      .map((htmlBody) => ({
        subject: DONE_EXECUTION_EMAIL_SUBJECT,
        body: htmlBody,
      }));
  }
}

export class ReactErrorExecutionMailContentGenerator implements MailContentGenerator<"ERROR"> {
  constructor(private readonly fileStore: FileStore) {}

  mailContentFrom(execution: ErrorExecution): ResultAsync<MailContent, ServiceError> {
    return safeRender(ErrorExecutionEmail({ execution }))
      .map((htmlBody) => ({
        subject: ERROR_EXECUTION_EMAIL_SUBJECT,
        body: htmlBody,
      }))
      .asyncMap((mailContent) => Promise.resolve(mailContent));
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
