import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateVideoOptionsUseCase } from "@core/usecases/GenerateVideoOptions";
import { SpokenQuote } from "@domain/SpokenQuote";
import { VideoOptions } from "@domain/Video";
import { mock } from "jest-mock-extended";
import { err, errAsync, ok, okAsync } from "neverthrow";

const fileStore = mock<FileStore>();
const createVideoQueue = mock<Queue<VideoOptions>>();

const generateVideoOptionsUseCase = new GenerateVideoOptionsUseCase(fileStore, createVideoQueue);

describe("GenerateVideoOptions Use Case - Integration Tests", () => {
  const spokenQuote: SpokenQuote = {
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

  const backgroundVideosLocation: FileLocation = "backgroundVideosLocation";

  describe("GIVEN the FileStore returns a list of background video locations", () => {
    const backgroundVideoLocations = ["backgroundVideoFile1.mp4", "backgroundVideoFile2.mp4"];

    beforeEach(() => {
      fileStore.listFiles.mockReturnValue(okAsync(backgroundVideoLocations));
    });

    describe("AND the VideoOptions is successfully created", () => {
      const videoOptions: VideoOptions = {
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
        jest.spyOn(generateVideoOptionsUseCase, "createVideoOptions").mockReturnValue(ok(videoOptions));
      });

      describe("AND the CreateVideoQueue successfully enqueues the VideoOptions", () => {
        beforeEach(() => {
          createVideoQueue.enqueue.mockReturnValue(okAsync(videoOptions));
        });

        describe("WHEN the Use Case is executed with a SpokenQuote and FPS", () => {
          test("THEN the FileStore should be called to get the background video locations", async () => {
            await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

            expect(fileStore.listFiles).toHaveBeenCalledTimes(1);
          });

          test("THEN the VideoOptions should be created", async () => {
            await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

            expect(generateVideoOptionsUseCase.createVideoOptions).toHaveBeenCalledWith(
              spokenQuote,
              backgroundVideoLocations,
              fps,
            );
          });

          test("THEN the VideoOptions should be enqueued", async () => {
            await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

            expect(createVideoQueue.enqueue).toHaveBeenCalledWith(videoOptions);
          });

          test("THEN the execution should return the VideoOptions, meaning success", async () => {
            const result = await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

            expect(result).toEqual(ok(videoOptions));
          });
        });
      });
    });

    describe("AND the VideoOptions fails to be created, due to an UnknownError", () => {
      const unknownError = new UnknownError();

      beforeEach(() => {
        jest.spyOn(generateVideoOptionsUseCase, "createVideoOptions").mockReturnValue(err(unknownError));
      });

      test("THEN the execution should return the UnknownError", async () => {
        const result = await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

        expect(result).toEqual(err(unknownError));
      });
    });
  });

  describe("GIVEN the FileStore fails to return a list of background video locations, due to a NetworkError", () => {
    const networkError = new NetworkError("Network error");

    beforeEach(() => {
      fileStore.listFiles.mockReturnValue(errAsync(networkError));
    });

    test("THEN the execution should return the NetworkError", async () => {
      const result = await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

      expect(result).toEqual(err(networkError));
    });
  });

  describe("GIVEN the FileStore fails to return a list of background video locations, due to an UnknownError", () => {
    const unknownError = new UnknownError();

    beforeEach(() => {
      fileStore.listFiles.mockReturnValue(errAsync(unknownError));
    });

    test("THEN the execution should return the UnknownError", async () => {
      const result = await generateVideoOptionsUseCase.execute(spokenQuote, fps, backgroundVideosLocation);

      expect(result).toEqual(err(unknownError));
    });
  });
});
