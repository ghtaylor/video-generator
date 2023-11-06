import { NotFoundError } from "@core/errors/NotFoundError";
import { SocialMediaUploader } from "@core/socialMediaUploader";
import { UploadVideoUseCase } from "@core/usecases/UploadVideo";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { Result, err } from "neverthrow";

function getSocialMediaUploader(eventSourceARN: string): Result<SocialMediaUploader, NotFoundError> {
  return err(new NotFoundError(`No uploader found for event source ARN: ${eventSourceARN}`));
}

class UploadVideoHandler {
  constructor(private readonly uploadVideoUseCase: UploadVideoUseCase) {}

  static build(eventSourceARN: string): UploadVideoHandler | null {
    return getSocialMediaUploader(eventSourceARN).match(
      (uploader) => {
        const useCase = new UploadVideoUseCase(uploader);
        return new UploadVideoHandler(useCase);
      },
      (error) => {
        console.log(error);
        return null;
      },
    );
  }

  async handle(record: SQSRecord): Promise<void> {
    console.log("Received record", JSON.stringify(record, null, 2));
  }
}

export default async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const handlerInstance = UploadVideoHandler.build(record.eventSourceARN);
    if (!handlerInstance) continue;

    await handlerInstance.handle(record);
  }
};
