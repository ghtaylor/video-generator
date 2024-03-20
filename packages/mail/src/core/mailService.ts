import { ServiceError } from "@core/errors/ServiceError";
import { Mail } from "@video-generator/domain/Mail";
import { ResultAsync } from "neverthrow";

export interface MailService {
  sendMail(mail: Mail): ResultAsync<null, ServiceError>;
}
