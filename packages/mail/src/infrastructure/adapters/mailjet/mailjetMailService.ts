import { ServiceError } from "@core/errors/ServiceError";
import { MailService } from "@core/mailService";
import { Mail } from "@video-generator/domain/Mail";
import { Result, ResultAsync, errAsync, fromPromise, ok } from "neverthrow";
import Mailjet, { SendEmailV3_1 } from "node-mailjet";

export class MailjetMailService implements MailService {
  constructor(private readonly mailjetClient: Mailjet) {}

  private postSendEmailRequest(request: SendEmailV3_1.Body): ResultAsync<SendEmailV3_1.Response, ServiceError> {
    return fromPromise(this.mailjetClient.post("send", { version: "v3.1" }).request(request), (error) => {
      return new ServiceError("Mailjet API error", { originalError: error });
    }).map(({ body }) => body as SendEmailV3_1.Response);
  }

  sendEmailRequestBodyFrom(mail: Mail): Result<SendEmailV3_1.Body, never> {
    return ok({
      Messages: [
        {
          From: {
            Email: mail.fromEmail,
          },
          To: [
            {
              Email: mail.toEmail,
            },
          ],
          Subject: mail.content.subject,
          HTMLPart: mail.content.body,
        },
      ],
    });
  }

  sendMail(mail: Mail): ResultAsync<null, ServiceError> {
    return this.sendEmailRequestBodyFrom(mail)
      .asyncAndThen(this.postSendEmailRequest.bind(this))
      .andThen((response) => {
        if (response.Messages[0].Status === "error")
          return errAsync(new ServiceError("Error sending mail", { originalError: response.Messages[0].Errors }));

        return ok(null);
      });
  }
}
