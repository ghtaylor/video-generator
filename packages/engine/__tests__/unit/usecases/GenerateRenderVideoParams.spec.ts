import { NetworkError } from "@core/errors/NetworkError";
import { ValidationError } from "@core/errors/ValidationError";
import { FileStore } from "@core/fileStore";
import { MessageSender } from "@core/messageSender";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { SpokenQuote } from "@video-generator/domain/Quote";
import { RenderVideoParams, VideoConfig, VideoResourcePaths, VideoResourceUrls } from "@video-generator/domain/Video";
import { errAsync, okAsync } from "neverthrow";
import { mock } from "vitest-mock-extended";

describe("GenerateRenderVideoParams Use Case - Unit Tests", () => {
  const fileStore = mock<FileStore>();
  const renderVideoMessageSender = mock<MessageSender<RenderVideoParams>>();

  const generateRenderVideoParamsUseCase = new GenerateRenderVideoParamsUseCase(fileStore, renderVideoMessageSender);

  describe("`videoResourceUrlsFrom`", () => {
    describe("WHEN `videoResourceUrlsFrom` is called with valid VideoResourcePaths", () => {
      const videoResourcePaths: VideoResourcePaths = {
        speechAudioPath: "speeches/1.mp3",
        backgroundVideoPaths: ["background_videos/1.mp4", "background_videos/2.mp4"],
        musicAudioPath: "music_audios/1.mp3",
      };

      describe("GIVEN getting the file URLs succeeds", () => {
        beforeEach(() => {
          fileStore.getUrl.mockImplementation((fileLocation) => okAsync(`https://${fileLocation}`));
        });

        test("THEN `videoResourceUrlsFrom` should return the expected VideoResourceUrls", async () => {
          const result = await generateRenderVideoParamsUseCase.videoResourceUrlsFrom(videoResourcePaths);

          expect(result._unsafeUnwrap()).toEqual<VideoResourceUrls>({
            speechAudioUrl: "https://speeches/1.mp3",
            backgroundVideoUrls: ["https://background_videos/1.mp4", "https://background_videos/2.mp4"],
            musicAudioUrl: "https://music_audios/1.mp3",
          });
        });
      });

      describe("GIVEN getting the file URLs fails due to a NetworkError", () => {
        beforeEach(() => {
          fileStore.getUrl.mockReturnValue(errAsync(new NetworkError("Failed to get file URL.")));
        });

        test("THEN `videoResourceUrlsFrom` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.videoResourceUrlsFrom(videoResourcePaths);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });
    });

    describe("WHEN `videoResourceUrlsFrom` is called with valid VideoResourcePaths, and the music audio is left undefined", () => {
      const videoResourcePaths: VideoResourcePaths = {
        speechAudioPath: "speeches/1.mp3",
        backgroundVideoPaths: ["background_videos/1.mp4", "background_videos/2.mp4"],
      };

      describe("GIVEN getting the file URLs succeeds", () => {
        beforeEach(() => {
          fileStore.getUrl.mockImplementation((fileLocation) => okAsync(`https://${fileLocation}`));
        });

        test("THEN `videoResourceUrlsFrom` should return the expected VideoResourceUrls", async () => {
          const result = await generateRenderVideoParamsUseCase.videoResourceUrlsFrom(videoResourcePaths);

          expect(result._unsafeUnwrap()).toEqual<VideoResourceUrls>({
            speechAudioUrl: "https://speeches/1.mp3",
            backgroundVideoUrls: ["https://background_videos/1.mp4", "https://background_videos/2.mp4"],
          });
        });
      });

      describe("GIVEN getting the file URLs fails due to a NetworkError", () => {
        beforeEach(() => {
          fileStore.getUrl.mockReturnValue(errAsync(new NetworkError("Failed to get file URL.")));
        });

        test("THEN `videoResourceUrlsFrom` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.videoResourceUrlsFrom(videoResourcePaths);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });
    });

    describe("WHEN `videoResourceUrlsFrom` is called with invalid VideoResourcePaths, as the background video paths are empty", () => {
      const videoResourcePaths: VideoResourcePaths = {
        speechAudioPath: "speeches/1.mp3",
        backgroundVideoPaths: [],
        musicAudioPath: "music_audios/1.mp3",
      };

      describe("GIVEN getting the file URLs succeeds", () => {
        beforeEach(() => {
          fileStore.getUrl.mockImplementation((fileLocation) => okAsync(`https://${fileLocation}`));
        });

        test("THEN `videoResourceUrlsFrom` should return a ValidationError", async () => {
          const result = await generateRenderVideoParamsUseCase.videoResourceUrlsFrom(videoResourcePaths);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError);
        });
      });
    });
  });

  describe("`renderVideoParamsFrom`", () => {
    const FPS = 30;

    describe.each<[SpokenQuote, VideoResourceUrls, VideoConfig["fps"], RenderVideoParams]>([
      [
        {
          title: "A Title",
          text: "This is an example, where there are two chunks.",
          speechAudioPath: "speeches/1.mp3",
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
        {
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          backgroundVideoUrls: ["https://bucket.aws.com/1.mp4", "https://bucket.aws.com/2.mp4"],
          musicAudioUrl: "https://bucket.aws.com/1.mp3",
        },
        FPS,
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          musicAudioUrl: "https://bucket.aws.com/1.mp3",
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
          speechAudioPath: "speeches/1.mp3",
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
        {
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          backgroundVideoUrls: [
            "https://bucket.aws.com/1.mp4",
            "https://bucket.aws.com/2.mp4",
            "https://bucket.aws.com/3.mp4",
          ],
          musicAudioUrl: "https://bucket.aws.com/1.mp3",
        },
        FPS,
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          musicAudioUrl: expect.stringContaining(".mp3"),
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
          speechAudioPath: "speeches/1.mp3",
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
        {
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          backgroundVideoUrls: ["https://bucket.aws.com/1.mp4"],
          musicAudioUrl: "https://bucket.aws.com/1.mp3",
        },
        FPS,
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          musicAudioUrl: expect.stringContaining(".mp3"),
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
      [
        {
          title: "A Title",
          text: "This is an example, where the outputted frames are rounded.",
          speechAudioPath: "speeches/1.mp3",
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
        {
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          backgroundVideoUrls: ["https://bucket.aws.com/1.mp4"],
        },
        FPS,
        {
          fps: FPS,
          speechAudioUrl: "https://bucket.aws.com/speech.mp3",
          musicAudioUrl: undefined,
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
      "GIVEN a SpokenQuote and background video paths",
      (spokenQuote, videoResources, fps, expectedRenderVideoParams) => {
        test("THEN `renderVideoParamsFrom` should return a result with the expected RenderVideoParams", () => {
          const result = generateRenderVideoParamsUseCase.renderVideoParamsFrom(spokenQuote, videoResources, fps);

          expect(result._unsafeUnwrap()).toEqual(expectedRenderVideoParams);
        });
      },
    );
  });

  describe("WHEN the `execute` method is called with a valid SpokenQuote and VideoConfig", () => {
    const VALID_SPOKEN_QUOTE: SpokenQuote = {
      title: "A Title",
      text: "This is an example, where there are two chunks.",
      speechAudioPath: "speeches/1.mp3",
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

    const VALID_VIDEO_CONFIG: VideoConfig = {
      fps: 30,
      backgroundVideoPaths: ["background_videos/1.mp4", "background_videos/2.mp4"],
      musicAudioPath: "music_audios/1.mp3",
    };

    describe("GIVEN all integrations are successful", () => {
      beforeEach(() => {
        fileStore.getUrl.mockImplementation((fileLocation) => okAsync(`https://${fileLocation}`));
        renderVideoMessageSender.send.mockImplementation((renderVideoParams) => okAsync(renderVideoParams));
      });

      test("THEN `execute` should return a successful result", async () => {
        const result = await generateRenderVideoParamsUseCase.execute(VALID_SPOKEN_QUOTE, VALID_VIDEO_CONFIG);

        expect(result.isOk()).toBe(true);
      });

      test("THEN `execute` should send the RenderVideoParams message", async () => {
        const result = await generateRenderVideoParamsUseCase.execute(VALID_SPOKEN_QUOTE, VALID_VIDEO_CONFIG);

        expect(renderVideoMessageSender.send).toHaveBeenCalledWith(result._unsafeUnwrap());
      });

      describe("EXCEPT sending the RenderVideoParams message fails due to a NetworkError", () => {
        beforeEach(() => {
          renderVideoMessageSender.send.mockReturnValue(
            errAsync(new NetworkError("Failed to send RenderVideoParams.")),
          );
        });

        test("THEN `execute` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.execute(VALID_SPOKEN_QUOTE, VALID_VIDEO_CONFIG);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });

      describe("EXCEPT getting the file URLs fails due to a NetworkError", () => {
        beforeEach(() => {
          fileStore.getUrl.mockReturnValue(errAsync(new NetworkError("Failed to get file URL.")));
        });

        test("THEN `execute` should return a NetworkError", async () => {
          const result = await generateRenderVideoParamsUseCase.execute(VALID_SPOKEN_QUOTE, VALID_VIDEO_CONFIG);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
      });
    });
  });
});
