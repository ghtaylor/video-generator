import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateVideoMetadataUseCase } from "@core/usecases/GenerateVideoMetadata";
import { VideoMetadata } from "@domain/VideoMetadata";
import { mock } from "jest-mock-extended";
import { err, errAsync, ok, okAsync } from "neverthrow";

const fileStore = mock<FileStore>();
const createVideoQueue = mock<Queue<VideoMetadata>>();

const generateSpokenQuoteUseCase = new GenerateVideoMetadataUseCase(fileStore, createVideoQueue);

describe("GenerateVideoMetadata Use Case - Integration Tests", () => {
  const spokenQuote = {
    text: "This is an example, a good one.",
    chunks: [
      {
        value: "This is an example,",
        start: 0,
        end: 1,
      },
      {
        value: "a good one.",
        start: 1,
        end: 2,
      },
    ],
    audioLocation: "speechAudioLocation",
  };

  const fps = 30;

  describe("GIVEN the FileStore returns a list of background video files", () => {
    const backgroundVideoFiles = ["backgroundVideoFile1.mp4", "backgroundVideoFile2.mp4"];

    beforeEach(() => {
      fileStore.getBackgroundVideoFiles.mockReturnValue(okAsync(backgroundVideoFiles));
    });

    describe("AND the VideoMetadata is successfully created", () => {
      const videoMetadata: VideoMetadata = {
        fps: 30,
        description: "This is an example, a good one.",
        speechAudioLocation: "speechAudioLocation",
        sections: [
          {
            text: "This is an example,",
            durationInFrames: 30,
            backgroundVideoLocation: "backgroundVideoFile1.mp4",
          },
          {
            text: "a good one.",
            durationInFrames: 30,
            backgroundVideoLocation: "backgroundVideoFile2.mp4",
          },
        ],
      };

      beforeEach(() => {
        jest.spyOn(generateSpokenQuoteUseCase, "createVideoMetadata").mockReturnValue(ok(videoMetadata));
      });

      describe("AND the CreateVideoQueue successfully enqueues the VideoMetadata", () => {
        beforeEach(() => {
          createVideoQueue.enqueue.mockReturnValue(okAsync(videoMetadata));
        });

        describe("WHEN the Use Case is executed with a SpokenQuote and FPS", () => {
          test("THEN the FileStore should be called to get the background video files", async () => {
            await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

            expect(fileStore.getBackgroundVideoFiles).toHaveBeenCalledTimes(1);
          });

          test("THEN the VideoMetadata should be created", async () => {
            await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

            expect(generateSpokenQuoteUseCase.createVideoMetadata).toHaveBeenCalledWith(
              spokenQuote,
              backgroundVideoFiles,
              fps,
            );
          });

          test("THEN the VideoMetadata should be enqueued", async () => {
            await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

            expect(createVideoQueue.enqueue).toHaveBeenCalledWith(videoMetadata);
          });

          test("THEN the execution should return the VideoMetadata, meaning success", async () => {
            const result = await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

            expect(result).toEqual(ok(videoMetadata));
          });
        });
      });
    });

    describe("AND the VideoMetadata fails to be created, due to an UnknownError", () => {
      const unknownError = new Error("UnknownError");

      beforeEach(() => {
        jest.spyOn(generateSpokenQuoteUseCase, "createVideoMetadata").mockReturnValue(err(unknownError));
      });

      test("THEN the execution should return the UnknownError", async () => {
        const result = await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

        expect(result).toEqual(err(unknownError));
      });
    });
  });

  describe("GIVEN the FileStore fails to return a list of background video files, due to a NetworkError", () => {
    const networkError = new Error("NetworkError");

    beforeEach(() => {
      fileStore.getBackgroundVideoFiles.mockReturnValue(errAsync(networkError));
    });

    test("THEN the execution should return the NetworkError", async () => {
      const result = await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

      expect(result).toEqual(err(networkError));
    });
  });

  describe("GIVEN the FileStore fails to return a list of background video files, due to an UnknownError", () => {
    const unknownError = new Error("UnknownError");

    beforeEach(() => {
      fileStore.getBackgroundVideoFiles.mockReturnValue(errAsync(unknownError));
    });

    test("THEN the execution should return the UnknownError", async () => {
      const result = await generateSpokenQuoteUseCase.execute(spokenQuote, fps);

      expect(result).toEqual(err(unknownError));
    });
  });
});
