import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { SocialMediaUploader } from "@core/socialMediaUploader";
import { UploadVideoUseCase } from "@core/usecases/UploadVideo";
import { VideoDetails } from "@domain/Video";
import { mock } from "jest-mock-extended";
import { err, errAsync, okAsync } from "neverthrow";

const socialMediaUploader = mock<SocialMediaUploader>();

const uploadVideoUseCase = new UploadVideoUseCase(socialMediaUploader);

describe("UploadVideo Use Case - Integration Tests", () => {
  const videoDetails: VideoDetails = {
    description: "This is an example",
    tags: ["example"],
    videoLocation: "videoLocation",
  };
  describe("GIVEN the SocialMediaUploader successfully uploads the video", () => {
    beforeEach(() => {
      socialMediaUploader.upload.mockReturnValue(okAsync("https://www.socialmedia.com/video"));
    });
    describe("WHEN the UploadVideo Use Case is executed with the VideoDetails", () => {
      test("THEN the SocialMediaUploader should be called with the VideoDetails", async () => {
        await uploadVideoUseCase.execute(videoDetails);
        expect(socialMediaUploader.upload).toHaveBeenCalledWith(videoDetails);
      });

      test("THEN the execution should be successful", async () => {
        const result = await uploadVideoUseCase.execute(videoDetails);
        expect(result.isOk()).toBe(true);
      });
    });
  });

  describe("GIVEN the SocialMediaUploader fails to upload the video, due to a NetworkError", () => {
    const networkError = new NetworkError("Network error");

    beforeEach(() => {
      socialMediaUploader.upload.mockReturnValue(errAsync(networkError));
    });

    describe("WHEN the UploadVideo Use Case is executed with the VideoDetails", () => {
      test("THEN the execution should return a NetworkError", async () => {
        const result = await uploadVideoUseCase.execute(videoDetails);
        expect(result).toEqual(err(networkError));
      });
    });
  });

  describe("GIVEN the SocialMediaUploader fails to upload the video, due to an UnknownError", () => {
    const unknownError = new UnknownError("Unknown error");

    beforeEach(() => {
      socialMediaUploader.upload.mockReturnValue(errAsync(unknownError));
    });

    describe("WHEN the UploadVideo Use Case is executed with the VideoDetails", () => {
      test("THEN the execution should return an UnknownError", async () => {
        const result = await uploadVideoUseCase.execute(videoDetails);
        expect(result).toEqual(err(unknownError));
      });
    });
  });
});
