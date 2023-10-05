import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateVideoMetadataUseCase } from "@core/usecases/GenerateVideoMetadata";
import { VideoMetadata } from "@domain/VideoMetadata";
import { mock } from "jest-mock-extended";
import { okAsync } from "neverthrow";

const fileStore = mock<FileStore>();
const createVideoQueue = mock<Queue<VideoMetadata>>();

const generateSpokenQuoteUseCase = new GenerateVideoMetadataUseCase(fileStore, createVideoQueue);

describe("GenerateVideoMetadata Use Case", () => {
  describe("GIVEN the FileStore returns a list of background video files", () => {
    const backgroundVideoFiles = ["backgroundVideoFile1.mp4", "backgroundVideoFile2.mp4"];

    beforeEach(() => {
      fileStore.getBackgroundVideoFiles.mockReturnValue(okAsync(backgroundVideoFiles));
    });

    describe("AND the ");
  });
});
