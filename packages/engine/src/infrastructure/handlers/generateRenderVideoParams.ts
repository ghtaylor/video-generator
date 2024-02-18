import { S3Client } from "@aws-sdk/client-s3";
import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SpokenQuote } from "@video-generator/domain/Quote";
import { RenderVideoParams, VideoConfig } from "@video-generator/domain/Video";
import { Bucket } from "sst/node/bucket";
import { z } from "zod";

const Payload = z.object({
  spokenQuote: SpokenQuote,
  videoConfig: VideoConfig,
});

export class GenerateRenderVideoParamsHandler {
  constructor(
    private readonly useCase: GenerateRenderVideoParamsUseCase,
    private readonly logger: Logger,
  ) {}

  static build(bucketName: string): GenerateRenderVideoParamsHandler {
    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const useCase = new GenerateRenderVideoParamsUseCase(s3FileStore);

    const logger = PinoLogger.build();

    return new GenerateRenderVideoParamsHandler(useCase, logger);
  }

  async handle(payload: unknown): Promise<RenderVideoParams> {
    return parseJson(payload, Payload)
      .asyncAndThen(({ spokenQuote, videoConfig }) => this.useCase.execute(spokenQuote, videoConfig))
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

const handlerInstance = GenerateRenderVideoParamsHandler.build(Bucket.Bucket.bucketName);

export default handlerInstance.handle.bind(handlerInstance);
