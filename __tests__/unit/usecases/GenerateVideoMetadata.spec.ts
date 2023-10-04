import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateVideoMetadataUseCase } from "@core/usecases/GenerateVideoMetadata";
import { SpokenQuoteChunk } from "@domain/SpokenQuote";
import { VideoMetadata, VideoSection } from "@domain/VideoMetadata";
import { mock } from "jest-mock-extended";

describe("GenerateVideoMetadata Use Case", () => {
  const FPS = 30;
  const fileStore = mock<FileStore>();
  const createVideoQueue = mock<Queue<VideoMetadata>>();

  const generateVideoMetadataUseCase = new GenerateVideoMetadataUseCase(fileStore, createVideoQueue);

  describe("`createBaseVideoSections`", () => {
    describe.each<[SpokenQuoteChunk[], FileLocation[], VideoSection[]]>([
      [
        [
          {
            value: "This is an example,",
            start: 0,
            end: 900,
          },
          {
            value: "with no time gap.",
            start: 900,
            end: 1800,
          },
        ],
        ["1.mp4", "2.mp4"],
        [
          {
            text: "This is an example,",
            durationInFrames: 30,
            backgroundVideoLocation: "1.mp4",
          },
          {
            text: "with no time gap.",
            durationInFrames: 30,
            backgroundVideoLocation: "2.mp4",
          },
        ],
      ],
      [
        [
          {
            value: "This is an example,",
            start: 0,
            end: 900,
          },
          {
            value: "with time gaps.",
            start: 930,
            end: 1830,
          },
          {
            value: "There's even three chunks.",
            start: 1860,
            end: 2760,
          },
        ],
        ["1.mp4", "2.mp4"],
        [
          {
            text: "This is an example,",
            durationInFrames: 31,
            backgroundVideoLocation: "1.mp4",
          },
          {
            text: "with time gaps.",
            durationInFrames: 31,
            backgroundVideoLocation: "2.mp4",
          },
          {
            text: "There's even three chunks.",
            durationInFrames: 30,
            backgroundVideoLocation: "1.mp4",
          },
        ],
      ],
      [
        [
          {
            value: "This is an example,",
            start: 0,
            end: 900,
          },
          {
            value: "where the outputted frames are rounded up.",
            start: 937,
            end: 1830,
          },
        ],
        ["1.mp4"],
        [
          {
            text: "This is an example,",
            durationInFrames: 32,
            backgroundVideoLocation: "1.mp4",
          },
          {
            text: "where the outputted frames are rounded up.",
            durationInFrames: 30,
            backgroundVideoLocation: "1.mp4",
          },
        ],
      ],
    ])("GIVEN a SpokenQuote", (spokenQuote, backgroundVideoLocations, expectedBaseVideoSections) => {
      test("THEN `createBaseVideoSections` returns the expected VideoSections", () => {
        const baseVideoSections = generateVideoMetadataUseCase.createVideoSections(
          spokenQuote,
          backgroundVideoLocations,
          FPS,
        );

        expect(baseVideoSections).toEqual(expectedBaseVideoSections);
      });
    });
  });
});
