import { ServiceError } from "@core/errors/ServiceError";
import { MailContentGeneratorFactory } from "@core/mailContentGenerator";
import { MailService } from "@core/mailService";
import { Execution } from "@video-generator/domain/Execution";
import { ResultAsync, okAsync } from "neverthrow";

export class SendMailOnExecutionUpdated {
  constructor(
    private readonly mailService: MailService,
    private readonly mailContentGeneratorFactory: MailContentGeneratorFactory,
  ) {}

  execute(execution: Execution, fromEmail: string, toEmail: string): ResultAsync<null, ServiceError> {
    if (execution.status !== "DONE" && execution.status !== "ERROR") return okAsync(null);

    return this.mailContentGeneratorFactory.create(execution.status).asyncAndThen((mailContentGenerator) => {
      if (mailContentGenerator === null) return okAsync(null);

      return mailContentGenerator
        .mailContentFrom(execution)
        .map((mailContent) => ({
          fromEmail,
          toEmail,
          content: mailContent,
        }))
        .asyncAndThen(this.mailService.sendMail.bind(this.mailService));
    });
  }
}
