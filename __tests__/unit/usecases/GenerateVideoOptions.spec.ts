import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateVideoOptionsUseCase } from "@core/usecases/GenerateVideoOptions";
import { SpokenQuote, SpokenQuoteChunk } from "@domain/SpokenQuote";
import { VideoOptions, VideoSection } from "@domain/Video";
import { mock } from "jest-mock-extended";
import { ok } from "neverthrow";

describe("GenerateVideoOptions Use Case", () => {
  const FPS = 30;
  const fileStore = mock<FileStore>();
  const createVideoQueue = mock<Queue<VideoOptions>>();

  const generateVideoOptionsUseCase = new GenerateVideoOptionsUseCase(fileStore, createVideoQueue);

  describe("`createVideoOptions`", () => {
    describe.each<[SpokenQuote, FileLocation[], VideoOptions]>([
      [
        {
          text: "This is an example, where there are two chunks.",
          audioLocation: "speechAudioLocation",
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
        ["1.mp4", "2.mp4"],
        {
          fps: FPS,
          description: "This is an example, where there are two chunks.",
          speechAudioLocation: "speechAudioLocation",
          sections: [
            {
              text: "This is an example,",
              durationInFrames: 27,
              backgroundVideoLocation: "1.mp4",
            },
            {
              text: "where there are two chunks.",
              durationInFrames: 27,
              backgroundVideoLocation: "2.mp4",
            },
          ],
        },
      ],
      [
        {
          text: "This is an example. There are four chunks of varying durations, and three background videos. See!",
          audioLocation: "speechAudioLocation",
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
        ["1.mp4", "2.mp4", "3.mp4"],
        {
          fps: FPS,
          description:
            "This is an example. There are four chunks of varying durations, and three background videos. See!",
          speechAudioLocation: "speechAudioLocation",
          sections: [
            {
              text: "This is an example.",
              durationInFrames: 18,
              backgroundVideoLocation: "1.mp4",
            },
            {
              text: "There are four chunks of varying durations,",
              durationInFrames: 36,
              backgroundVideoLocation: "2.mp4",
            },
            {
              text: "and three background videos.",
              durationInFrames: 36,
              backgroundVideoLocation: "3.mp4",
            },
            {
              text: "See!",
              durationInFrames: 9,
              backgroundVideoLocation: "1.mp4",
            },
          ],
        },
      ],
      [
        {
          text: "This is an example, where the outputted frames are rounded.",
          audioLocation: "speechAudioLocation",
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
        ["1.mp4"],
        {
          fps: FPS,
          description: "This is an example, where the outputted frames are rounded.",
          speechAudioLocation: "speechAudioLocation",
          sections: [
            {
              text: "This is an example,",
              durationInFrames: 28,
              backgroundVideoLocation: "1.mp4",
            },
            {
              text: "where the outputted frames are rounded.",
              durationInFrames: 27,
              backgroundVideoLocation: "1.mp4",
            },
          ],
        },
      ],
    ])(
      "GIVEN a SpokenQuote and background video locations",
      (spokenQuote, backgroundVideoLocations, expectedBaseVideoSections) => {
        test("THEN `createVideoOptions` returns the expected VideoOptions", () => {
          const videoOptions = generateVideoOptionsUseCase.createVideoOptions(
            spokenQuote,
            backgroundVideoLocations,
            FPS,
          );

          expect(videoOptions).toEqual(ok(expectedBaseVideoSections));
        });
      },
    );
  });
});
