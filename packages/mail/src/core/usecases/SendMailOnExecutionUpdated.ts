import { ServiceError } from "@core/errors/ServiceError";
import { Mail, MailContent, MailService } from "@core/mailService";
import { Execution, DoneExecution, ExecutionStatus } from "@video-generator/domain/Execution";
import { ResultAsync, okAsync } from "neverthrow";

interface MailContentStrategy {
  mailContentFrom(execution: Execution): MailContent;
}

class ErrorExecutionMailContentStrategy implements MailContentStrategy {
  mailContentFrom(execution: Execution): MailContent {
    return {
      subject: `Execution failed`,
      body: `The execution with id ${execution.id} has failed.`,
    };
  }
}

class DoneExecutionMailContentStrategy implements MailContentStrategy {
  mailContentFrom(execution: DoneExecution): MailContent {
    return {
      subject: `Execution succeeded`,
      body: `The execution with id ${execution.id} has succeeded.`,
    };
  }
}

export class SendMailOnExecutionUpdated {
  private readonly STRATEGIES = new Map<ExecutionStatus, MailContentStrategy>([
    ["DONE", new DoneExecutionMailContentStrategy()],
    ["ERROR", new ErrorExecutionMailContentStrategy()],
  ]);

  constructor(private mailService: MailService) {}

  execute(execution: Execution, fromEmail: string, toEmail: string): ResultAsync<null, ServiceError> {
    const strategy = this.STRATEGIES.get(execution.status);
    if (strategy === undefined) return okAsync(null);

    const mail: Mail = {
      fromEmail,
      toEmail,
      content: strategy.mailContentFrom(execution),
    };

    return this.mailService.sendMail(mail);
  }
}
