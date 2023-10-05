import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { GenerateVideoMetadataUseCase } from "@core/usecases/GenerateVideoMetadata";
import { SpokenQuote, SpokenQuoteChunk } from "@domain/SpokenQuote";
import { VideoMetadata, VideoSection } from "@domain/VideoMetadata";
import { mock } from "jest-mock-extended";
import { ok } from "neverthrow";

describe("GenerateVideoMetadata Use Case", () => {
  const FPS = 30;
  const fileStore = mock<FileStore>();
  const createVideoQueue = mock<Queue<VideoMetadata>>();

  const generateVideoMetadataUseCase = new GenerateVideoMetadataUseCase(fileStore, createVideoQueue);

  describe("`createVideoMetadata`", () => {
    describe.each<[SpokenQuote, FileLocation[], VideoMetadata]>([
      [
        {
          text: "This is an example, with no time gap.",
          chunks: [
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
          audioLocation: "speechAudioLocation",
        },
        ["1.mp4", "2.mp4"],
        {
          fps: FPS,
          description: "This is an example, with no time gap.",
          speechAudioLocation: "speechAudioLocation",
          sections: [
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
        },
      ],
      [
        {
          text: "This is an example, with time gaps. There's even three chunks.",
          audioLocation: "speechAudioLocation",
          chunks: [
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
        },
        ["1.mp4", "2.mp4"],
        {
          fps: FPS,
          description: "This is an example, with time gaps. There's even three chunks.",
          speechAudioLocation: "speechAudioLocation",
          sections: [
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
              durationInFrames: 31,
              backgroundVideoLocation: "1.mp4",
            },
            {
              text: "where the outputted frames are rounded.",
              durationInFrames: 30,
              backgroundVideoLocation: "1.mp4",
            },
          ],
        },
      ],
    ])(
      "GIVEN a SpokenQuote and background video locations",
      (spokenQuote, backgroundVideoLocations, expectedBaseVideoSections) => {
        test("THEN `createVideoMetadata` returns the expected VideoMetadata", () => {
          const videoMetadata = generateVideoMetadataUseCase.createVideoMetadata(
            spokenQuote,
            backgroundVideoLocations,
            FPS,
          );

          expect(videoMetadata).toEqual(ok(expectedBaseVideoSections));
        });
      },
    );
  });
});
