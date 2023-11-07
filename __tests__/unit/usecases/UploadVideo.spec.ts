import { FileStore } from "@core/fileStore";
import { SocialMediaUploader } from "@core/socialMediaUploader";
import { UploadVideoUseCase } from "@core/usecases/UploadVideo";
import { UploadVideoParams, VideoData, VideoDataKind, VideoMetadata } from "@domain/Video";
import { mock } from "jest-mock-extended";
import { okAsync } from "neverthrow";

describe("UploadVideo Use Case - Unit Tests", () => {
  const socialMediaUploader = mock<SocialMediaUploader>();
  const fileStore = mock<FileStore>();
  const uploadVideoUseCase = new UploadVideoUseCase(socialMediaUploader, fileStore);

  describe("WHEN the `execute` method is called", () => {
    const VALID_UPLOAD_VIDEO_PARAMS: UploadVideoParams = {
      videoLocation: "video_location",
      metadata: {
        title: "video_title",
        description: "video_description",
      },
    };

    describe("AND the video data kind is a Buffer", () => {
      describe("GIVEN all integrations are successful", () => {
        beforeEach(() => {
          fileStore.getBuffer.mockReturnValue(okAsync(Buffer.from("video data")));
          fileStore.getUrl.mockReturnValue(okAsync("video_url"));
          socialMediaUploader.upload.mockReturnValue(okAsync("video_id"));
        });

        test("THEN `execute` should return a successful result", async () => {
          const result = await uploadVideoUseCase.execute(VALID_UPLOAD_VIDEO_PARAMS, VideoDataKind.Buffer);

          expect(result.isOk()).toBe(true);
        });

        test("THEN the social media uploader should be called with video data as buffer", async () => {
          await uploadVideoUseCase.execute(VALID_UPLOAD_VIDEO_PARAMS, VideoDataKind.Buffer);

          expect(socialMediaUploader.upload).toHaveBeenCalledWith<[VideoData, VideoMetadata]>(
            {
              kind: VideoDataKind.Buffer,
              buffer: Buffer.from("video data"),
            },
            VALID_UPLOAD_VIDEO_PARAMS.metadata,
          );
        });
      });
    });

    describe("AND the video data kind is a URL", () => {
      describe("GIVEN all integrations are successful", () => {
        beforeEach(() => {
          fileStore.getBuffer.mockReturnValue(okAsync(Buffer.from("video data")));
          fileStore.getUrl.mockReturnValue(okAsync("video_url"));
          socialMediaUploader.upload.mockReturnValue(okAsync("video_id"));
        });

        test("THEN `execute` should return a successful result", async () => {
          const result = await uploadVideoUseCase.execute(VALID_UPLOAD_VIDEO_PARAMS, VideoDataKind.Url);

          expect(result.isOk()).toBe(true);
        });

        test("THEN the social media uploader should be called with video data as buffer", async () => {
          await uploadVideoUseCase.execute(VALID_UPLOAD_VIDEO_PARAMS, VideoDataKind.Url);

          expect(socialMediaUploader.upload).toHaveBeenCalledWith<[VideoData, VideoMetadata]>(
            {
              kind: VideoDataKind.Url,
              url: "video_url",
            },
            VALID_UPLOAD_VIDEO_PARAMS.metadata,
          );
        });
      });
    });
  });
});
