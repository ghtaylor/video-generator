import { ResultAsync } from "neverthrow";
import { ServiceError } from "@core/errors/ServiceError";

export type MailContent = {
  subject: string;
  body: string;
};

export type Mail = {
  fromEmail: string;
  toEmail: string;
  content: MailContent;
};

export interface MailService {
  sendMail(mail: Mail): ResultAsync<null, ServiceError>;
}
