import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { SendMailOnExecutionUpdated } from "@core/usecases/SendMailOnExecutionUpdated";
import { MailjetConfig } from "@infrastructure/adapters/mailjet/config";
import { MailjetMailService } from "@infrastructure/adapters/mailjet/mailjetMailService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { Execution } from "@video-generator/domain/Execution";
import { EventBridgeHandler } from "aws-lambda";
import { parseJsonString } from "common/parseJson";
import { Result } from "neverthrow";
import Mailjet from "node-mailjet";
import { Config } from "sst/node/config";

export class OnExecutionUpdatedHandler {
  constructor(
    private readonly useCase: SendMailOnExecutionUpdated,
    private readonly emailAddress: string,
    private readonly logger: Logger,
  ) {}

  static build(
    mailjetConfig: string,
    emailAddress: string,
    logger: Logger = PinoLogger.build(),
  ): Result<OnExecutionUpdatedHandler, ParseError> {
    return parseJsonString(mailjetConfig, MailjetConfig).map((mailjetConfig) => {
      const mailjet = new Mailjet(mailjetConfig);
      const mailjetMailService = new MailjetMailService(mailjet);

      const useCase = new SendMailOnExecutionUpdated(mailjetMailService);

      return new OnExecutionUpdatedHandler(useCase, emailAddress, logger);
    });
  }

  handle: EventBridgeHandler<"executionUpdated", Execution, void> = async (event) => {
    return this.useCase.execute(event.detail, this.emailAddress, this.emailAddress).match(
      () => {
        this.logger.info(`Handled execution updated event for execution ${event.detail.id}`);
      },
      (error) => {
        this.logger.error(`Error handling execution updated event for execution ${event.detail.id}`, error);
      },
    );
  };
}

const handle: EventBridgeHandler<"executionUpdated", Execution, void> = (event, context, callback) => {
  const logger = PinoLogger.build();

  return OnExecutionUpdatedHandler.build(Config.MAILJET_CONFIG, Config.EMAIL_ADDRESS, logger).match(
    (handlerInstance) => handlerInstance.handle(event, context, callback),
    (error) => {
      logger.error("Failed to create handler", error);
    },
  );
};

export default handle;
