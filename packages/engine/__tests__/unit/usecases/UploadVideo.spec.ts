import { FileStore } from "@core/fileStore";
import { UploadVideoUseCase } from "@core/usecases/UploadVideo";
import { VideoUploader } from "@core/videoUploader";
import { UploadVideoParams, UploadVideoPlatform, VideoData, VideoMetadata } from "@video-generator/domain/Video";
import { mock } from "vitest-mock-extended";
import { okAsync } from "neverthrow";

describe("UploadVideo Use Case - Unit Tests", () => {
  describe("WHEN the `execute` method is called", () => {
    const VALID_UPLOAD_VIDEO_PARAMS: UploadVideoParams = {
      videoPath: "video_location",
      metadata: {
        title: "video_title",
        description: "video_description",
      },
    };

    describe("AND the video uploader is for YouTube platform", () => {
      const videoUploader = mock<VideoUploader<UploadVideoPlatform>>({
        platform: UploadVideoPlatform.YouTube,
      });
      const fileStore = mock<FileStore>();
      const uploadVideoUseCase = new UploadVideoUseCase(videoUploader, fileStore);

      describe("GIVEN all integrations are successful", () => {
        beforeEach(() => {
          fileStore.getBuffer.mockReturnValue(okAsync(Buffer.from("video data")));
          fileStore.getUrl.mockReturnValue(okAsync("video_url"));
          videoUploader.upload.mockReturnValue(okAsync("video_id"));
        });

        test("THEN `execute` should return a successful result", async () => {
          const result = await uploadVideoUseCase.execute(VALID_UPLOAD_VIDEO_PARAMS);

          expect(result.isOk()).toBe(true);
        });

        test("THEN the social media uploader should be called with video data as buffer", async () => {
          await uploadVideoUseCase.execute(VALID_UPLOAD_VIDEO_PARAMS);

          expect(videoUploader.upload).toHaveBeenCalledWith<[VideoData, VideoMetadata]>(
            Buffer.from("video data"),
            VALID_UPLOAD_VIDEO_PARAMS.metadata,
          );
        });
      });
    });
  });
});
