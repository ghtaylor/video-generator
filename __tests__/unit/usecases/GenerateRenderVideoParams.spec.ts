import { NetworkError } from "@core/errors/NetworkError";
import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { FileUrl } from "@domain/FIle";
import { SpokenQuote } from "@domain/SpokenQuote";
import { RenderVideoParams } from "@domain/Video";
import { mock } from "jest-mock-extended";
import { errAsync, okAsync } from "neverthrow";

describe("GenerateRenderVideoParams Use Case - Unit Tests", () => {
  const FPS = 30;
  const BACKGROUND_VIDEOS_LOCATION = "backgroundVideosLocation";

  const fileStore = mock<FileStore>();
  const renderVideoQueue = mock<Queue<RenderVideoParams>>();

  const generateRenderVideoParamsUseCase = new GenerateRenderVideoParamsUseCase(fileStore, renderVideoQueue);

  describe("`renderVideoParamsFrom`", () => {
    describe.each<[SpokenQuote, FileUrl[], RenderVideoParams]>([
      [
        {
          title: "A Title",
          text: "This is an example, where there are two chunks.",
          audioUrl: "https://bucket.aws.com/audioLocation",
          chunks: [
            {
              value: "This is an example,",
              start: 0,
              end: 900,
            },
            {
              value: "where there are two chunks.",
              start: 900,
              end: 1800,
            },
          ],
        },
        ["https://bucket.aws.com/1.mp4", "https://bucket.aws.com/2.mp4"],
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/audioLocation",
          sections: [
            {
              text: "This is an example,",
              durationInFrames: 27,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
            {
              text: "where there are two chunks.",
              durationInFrames: 27,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
          ],
          metadata: {
            title: "A Title",
            description: "This is an example, where there are two chunks.",
          },
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example. There are four chunks of varying durations, and three background videos. See!",
          audioUrl: "https://bucket.aws.com/speechAudioLocation",
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 600,
            },
            {
              value: "There are four chunks of varying durations,",
              start: 600,
              end: 1800,
            },
            {
              value: "and three background videos.",
              start: 1800,
              end: 3000,
            },
            {
              value: "See!",
              start: 3000,
              end: 3300,
            },
          ],
        },
        ["https://bucket.aws.com/1.mp4", "https://bucket.aws.com/2.mp4", "https://bucket.aws.com/3.mp4"],
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/speechAudioLocation",
          sections: [
            {
              text: "This is an example.",
              durationInFrames: 18,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
            {
              text: "There are four chunks of varying durations,",
              durationInFrames: 36,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
            {
              text: "and three background videos.",
              durationInFrames: 36,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
            {
              text: "See!",
              durationInFrames: 9,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
          ],
          metadata: {
            title: "A Title",
            description:
              "This is an example. There are four chunks of varying durations, and three background videos. See!",
          },
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example, where the outputted frames are rounded.",
          audioUrl: "https://bucket.aws.com/speechAudioLocation",
          chunks: [
            {
              value: "This is an example,",
              start: 0,
              end: 900,
            },
            {
              value: "where the outputted frames are rounded.",
              start: 937,
              end: 1830,
            },
          ],
        },
        ["https://bucket.aws.com/1.mp4"],
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/speechAudioLocation",
          sections: [
            {
              text: "This is an example,",
              durationInFrames: 28,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
            {
              text: "where the outputted frames are rounded.",
              durationInFrames: 27,
              backgroundVideoUrl: expect.stringContaining(".mp4"),
            },
          ],
          metadata: {
            title: "A Title",
            description: "This is an example, where the outputted frames are rounded.",
          },
        },
      ],
    ])(
      "GIVEN a SpokenQuote and background video locations",
      (spokenQuote, backgroundVideoUrls, expectedRenderVideoParams) => {
        test("THEN `renderVideoParamsFrom` should return a result with the expected RenderVideoParams", () => {
          const result = generateRenderVideoParamsUseCase.renderVideoParamsFrom(spokenQuote, backgroundVideoUrls, FPS);

          expect(result._unsafeUnwrap()).toEqual(expectedRenderVideoParams);
        });
      },
    );
  });

  describe("WHEN the `execute` method is called", () => {
    const VALID_SPOKEN_QUOTE: SpokenQuote = {
      title: "A Title",
      text: "This is an example, where there are two chunks.",
      audioUrl: "https://bucket.aws.com/audioLocation",
      chunks: [
        {
          value: "This is an example,",
          start: 0,
          end: 900,
        },
        {
          value: "where there are two chunks.",
          start: 900,
          end: 1800,
        },
      ],
    };

    describe("GIVEN all integrations are successful", () => {
      beforeEach(() => {
        fileStore.listFiles.mockReturnValue(okAsync(["1.mp4", "2.mp4"]));
        fileStore.getUrl.mockImplementation((fileLocation) => okAsync(`https://${fileLocation}`));
        renderVideoQueue.enqueue.mockImplementation((renderVideoParams) => okAsync(renderVideoParams));
      });

      test("THEN `execute` should return a successful result", async () => {
        const result = await generateRenderVideoParamsUseCase.execute(
          VALID_SPOKEN_QUOTE,
          FPS,
          BACKGROUND_VIDEOS_LOCATION,
        );

        expect(result.isOk()).toBe(true);
      });

      describe("EXCEPT enqueueing the RenderVideoParams fails due to a NetworkError", () => {
        beforeEach(() => {
          renderVideoQueue.enqueue.mockResolvedValue(
            errAsync(new NetworkError("Failed to enqueue RenderVideoParams.")),
          );
        });

        test("THEN `execute` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.execute(
            VALID_SPOKEN_QUOTE,
            FPS,
            BACKGROUND_VIDEOS_LOCATION,
          );

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });

      describe("EXCEPT getting the file URLs fails due to a NetworkError", () => {
        beforeEach(() => {
          fileStore.getUrl.mockReturnValue(errAsync(new NetworkError("Failed to get file URL.")));
        });

        test("THEN `execute` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.execute(
            VALID_SPOKEN_QUOTE,
            FPS,
            BACKGROUND_VIDEOS_LOCATION,
          );

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });

      describe("EXCEPT listing the files fails due to a NetworkError", () => {
        beforeEach(() => {
          fileStore.listFiles.mockReturnValue(errAsync(new NetworkError("Failed to list files.")));
        });

        test("THEN `execute` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.execute(
            VALID_SPOKEN_QUOTE,
            FPS,
            BACKGROUND_VIDEOS_LOCATION,
          );

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });
    });
  });
});
