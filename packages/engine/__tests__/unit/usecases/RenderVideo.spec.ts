import { FileStore } from "@core/fileStore";
import { ProgressReporter } from "@core/progressReporter";
import { RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { VideoRenderer } from "@core/videoRenderer";
import { RenderVideoParams } from "@video-generator/domain/Video";
import { okAsync } from "neverthrow";
import { mock } from "vitest-mock-extended";

type RenderProgress = number;
type StartEngineProgress = number;
type EndEngineProgress = number;
type ExpectedEngineProgress = number;

describe("RenderVideo Use Case - Unit Tests", () => {
  const videoRenderer = mock<VideoRenderer>();
  const fileStore = mock<FileStore>();
  const progressReporter = mock<ProgressReporter>();

  const useCase = new RenderVideoUseCase(videoRenderer, fileStore, progressReporter);

  describe("WHEN `engineProgressFrom` is called", () => {
    describe.each<[RenderProgress, StartEngineProgress, EndEngineProgress, ExpectedEngineProgress]>([
      [0, 0.75, 0.95, 0.75],
      [0.25, 0.75, 0.95, 0.8],
      [0.5, 0.75, 0.95, 0.85],
      [0.75, 0.75, 0.95, 0.9],
      [1, 0.75, 0.95, 0.95],

      [0, 0, 1, 0],
      [0.25, 0, 1, 0.25],
      [0.5, 0, 1, 0.5],
      [0.75, 0, 1, 0.75],
      [1, 0, 1, 1],

      [0, 0.75, 1, 0.75],
      [0.25, 0.75, 1, 0.81],
      [0.5, 0.75, 1, 0.88],
      [0.75, 0.75, 1, 0.94],
      [1, 0.75, 1, 1],
    ])(
      "GIVEN render progress is %s, start total progress is %s and end engine progress is %s",
      (renderProgress, startEngineProgress, endEngineProgress, expectedEngineProgress) => {
        it(`THEN the expected total engine progress should be ${expectedEngineProgress}`, () => {
          const result = useCase.engineProgressFrom(renderProgress, startEngineProgress, endEngineProgress);
          expect(result._unsafeUnwrap().progress).toEqual(expectedEngineProgress);
        });
      },
    );
  });

  describe("WHEN the Use Case is executed", () => {
    beforeEach(() => {
      useCase.reportedRenderProgress = new Set();
    });

    const VALID_RENDER_VIDEO_PARAMS: RenderVideoParams = {
      fps: 30,
      speechAudioUrl: "https://speeches/1.mp3",
      sections: [],
      metadata: {
        title: "title",
        description: "description",
      },
    };

    describe("GIVEN all integrations are successful", () => {
      beforeEach(() => {
        videoRenderer.renderVideo.mockReturnValue(okAsync(Buffer.from("video")));
        fileStore.store.mockReturnValue(okAsync("videoPath"));
        progressReporter.reportProgress.mockImplementation((progress) => okAsync(progress));
      });

      describe.each<RenderProgress>([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])(
        "AND the render video process calls the `onProgress` callback with a progress divisible by 0.1: %s",
        (renderProgress) => {
          beforeEach(() => {
            videoRenderer.renderVideo.mockImplementation((_, onProgress) => {
              onProgress?.(renderProgress);
              return okAsync(Buffer.from("video"));
            });
          });

          afterEach(() => {
            progressReporter.reportProgress.mockReset();
          });

          test("THEN the Progress Reporter should be called", async () => {
            const expectedEngineProgress = useCase
              .engineProgressFrom(renderProgress, useCase.START_ENGINE_PROGRESS, useCase.END_ENGINE_PROGRESS)
              ._unsafeUnwrap();

            await useCase.execute(VALID_RENDER_VIDEO_PARAMS);

            expect(progressReporter.reportProgress).toHaveBeenCalledWith(expectedEngineProgress);
          });
        },
      );

      describe.each<RenderProgress>([0.01, 0.07, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89, 0.99])(
        "AND the render video process calls the `onProgress` callback with a progress that is NOT divisible by 0.1: %s",
        (renderProgress) => {
          beforeEach(() => {
            videoRenderer.renderVideo.mockImplementation((_, onProgress) => {
              onProgress?.(renderProgress);
              return okAsync(Buffer.from("video"));
            });
          });

          afterEach(() => {
            progressReporter.reportProgress.mockReset();
          });

          test("THEN the Progress Reporter should NOT be called", async () => {
            await useCase.execute(VALID_RENDER_VIDEO_PARAMS);

            expect(progressReporter.reportProgress).not.toHaveBeenCalled();
          });
        },
      );

      describe("AND the render video process calls the `onProgress` callback with the same progress more than once", () => {
        beforeEach(() => {
          videoRenderer.renderVideo.mockImplementation((_, onProgress) => {
            onProgress?.(0.1);
            onProgress?.(0.1);
            onProgress?.(0.1);

            return okAsync(Buffer.from("video"));
          });
        });

        afterEach(() => {
          progressReporter.reportProgress.mockReset();
        });

        test("THEN the Progress Reporter should be called only once", async () => {
          const expectedEngineProgress = useCase
            .engineProgressFrom(0.1, useCase.START_ENGINE_PROGRESS, useCase.END_ENGINE_PROGRESS)
            ._unsafeUnwrap();

          await useCase.execute(VALID_RENDER_VIDEO_PARAMS);

          expect(progressReporter.reportProgress).toHaveBeenCalledTimes(1);
          expect(progressReporter.reportProgress).toHaveBeenCalledWith(expectedEngineProgress);
        });
      });
    });
  });
});
