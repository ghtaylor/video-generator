import { S3Client } from "@aws-sdk/client-s3";
import { parseJson, parseJsonString } from "@common/parseJson";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SpokenQuote } from "@video-generator/domain/Quote";
import { RenderVideoParams, VideoConfig } from "@video-generator/domain/Video";
import { Result } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Config } from "sst/node/config";

export class GenerateRenderVideoParamsHandler {
  constructor(
    private readonly useCase: GenerateRenderVideoParamsUseCase,
    private readonly videoConfig: VideoConfig,
    private readonly logger: Logger,
  ) {}

  static build(
    bucketName: string,
    videoConfig: string,
    logger: Logger = PinoLogger.build(),
  ): Result<GenerateRenderVideoParamsHandler, ParseError> {
    return parseJsonString(videoConfig, VideoConfig).map((videoConfig) => {
      const s3Client = new S3Client({});
      const s3FileStore = new S3FileStore(s3Client, bucketName);

      const useCase = new GenerateRenderVideoParamsUseCase(s3FileStore);

      return new GenerateRenderVideoParamsHandler(useCase, videoConfig, logger);
    });
  }

  async handle(event: unknown): Promise<RenderVideoParams> {
    return parseJson(event, SpokenQuote)
      .asyncAndThen((spokenQuote) => this.useCase.execute(spokenQuote, this.videoConfig))
      .match(
        (renderVideoParams) => {
          this.logger.info("Render video params generated", renderVideoParams);
          return renderVideoParams;
        },
        (error) => {
          this.logger.error("Error generating render video params", error);
          throw error;
        },
      );
  }
}

export default async (event: unknown): Promise<RenderVideoParams> => {
  const logger = PinoLogger.build();

  return GenerateRenderVideoParamsHandler.build(Bucket.Bucket.bucketName, Config.VIDEO_CONFIG, logger).match(
    async (handlerInstance) => handlerInstance.handle(event),
    async (error) => {
      logger.error("Failed to create handler", error);
      throw error;
    },
  );
};
