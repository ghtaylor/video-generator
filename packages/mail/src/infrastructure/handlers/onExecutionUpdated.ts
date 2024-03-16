import { S3Client } from "@aws-sdk/client-s3";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { SendMailOnExecutionUpdated } from "@core/usecases/SendMailOnExecutionUpdated";
import { MailjetConfig } from "@infrastructure/adapters/mailjet/config";
import { MailjetMailService } from "@infrastructure/adapters/mailjet/mailjetMailService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { ReactMailContentGeneratorFactory } from "@infrastructure/adapters/mailContentGenerator/reactMailContentGenerator";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { Execution } from "@video-generator/domain/Execution";
import { EventBridgeHandler } from "aws-lambda";
import { parseJsonString } from "common/parseJson";
import { Result } from "neverthrow";
import Mailjet from "node-mailjet";
import { Bucket } from "sst/node/bucket";
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
    bucketName: string,
    logger: Logger = PinoLogger.build(),
  ): Result<OnExecutionUpdatedHandler, ParseError> {
    return parseJsonString(mailjetConfig, MailjetConfig).map((mailjetConfig) => {
      const mailjet = new Mailjet(mailjetConfig);
      const mailjetMailService = new MailjetMailService(mailjet);

      const s3Client = new S3Client();
      const s3FileStore = new S3FileStore(s3Client, bucketName);
      const reactMailContentGeneratorFactory = new ReactMailContentGeneratorFactory(s3FileStore);

      const useCase = new SendMailOnExecutionUpdated(mailjetMailService, reactMailContentGeneratorFactory);

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

  return OnExecutionUpdatedHandler.build(
    Config.MAILJET_CONFIG,
    Config.EMAIL_ADDRESS,
    Bucket.Bucket.bucketName,
    logger,
  ).match(
    (handlerInstance) => handlerInstance.handle(event, context, callback),
    (error) => {
      logger.error("Failed to create handler", error);
    },
  );
};

export default handle;
