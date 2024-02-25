import { FileStore } from "@core/fileStore";
import { ExecutionManager } from "@core/executionManager";
import { ReportExecutionStateChangedParams, RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { VideoRenderer } from "@core/videoRenderer";
import { RenderVideoParams } from "@video-generator/domain/Video";
import { okAsync } from "neverthrow";
import { mock } from "vitest-mock-extended";

type ExpectedExecutionState = number;
type RenderProgress = number;

describe("RenderVideo Use Case - Unit Tests", () => {
  const videoRenderer = mock<VideoRenderer>();
  const fileStore = mock<FileStore>();
  const executionManager = mock<ExecutionManager>();

  const useCase = new RenderVideoUseCase(videoRenderer, fileStore, executionManager);

  const VALID_EXECUTION_ID = "executionId";

  const VALID_RENDER_VIDEO_PARAMS: RenderVideoParams = {
    fps: 30,
    speechAudioUrl: "https://speeches/1.mp3",
    sections: [],
    metadata: {
      title: "title",
      description: "description",
    },
  };

  describe("WHEN `executionStateFrom` is called", () => {
    describe.each<[ReportExecutionStateChangedParams, ExpectedExecutionState]>([
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0,
          startExecutionState: 0.75,
          endExecutionState: 0.95,
        },
        0.75,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.25,
          startExecutionState: 0.75,
          endExecutionState: 0.95,
        },
        0.8,
      ],

      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.5,
          startExecutionState: 0.75,
          endExecutionState: 0.95,
        },
        0.85,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.75,
          startExecutionState: 0.75,
          endExecutionState: 0.95,
        },
        0.9,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 1,
          startExecutionState: 0.75,
          endExecutionState: 0.95,
        },
        0.95,
      ],

      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0,
          startExecutionState: 0,
          endExecutionState: 1,
        },
        0,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.25,
          startExecutionState: 0,
          endExecutionState: 1,
        },
        0.25,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.5,
          startExecutionState: 0,
          endExecutionState: 1,
        },
        0.5,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.75,
          startExecutionState: 0,
          endExecutionState: 1,
        },
        0.75,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 1,
          startExecutionState: 0,
          endExecutionState: 1,
        },
        1,
      ],

      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0,
          startExecutionState: 0.75,
          endExecutionState: 1,
        },
        0.75,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.25,
          startExecutionState: 0.75,
          endExecutionState: 1,
        },
        0.81,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.5,
          startExecutionState: 0.75,
          endExecutionState: 1,
        },
        0.88,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.75,
          startExecutionState: 0.75,
          endExecutionState: 1,
        },
        0.94,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 1,
          startExecutionState: 0.75,
          endExecutionState: 1,
        },
        1,
      ],
    ])(
      "GIVEN render progress is %s, start total progress is %s and end engine progress is %s",
      (reportRenderProgressParams, expectedExecutionState) => {
        it(`THEN the expected total engine progress should be ${expectedExecutionState}`, () => {
          const result = useCase.executionStateFrom(reportRenderProgressParams);
          expect(result._unsafeUnwrap().progress).toEqual(expectedExecutionState);
        });
      },
    );
  });

  describe("WHEN the Use Case is executed", () => {
    beforeEach(() => {
      useCase.reportedRenderProgress = new Set();
    });

    describe("GIVEN all integrations are successful", () => {
      beforeEach(() => {
        videoRenderer.renderVideo.mockReturnValue(okAsync(Buffer.from("video")));
        fileStore.store.mockReturnValue(okAsync("videoPath"));
        executionManager.reportState.mockImplementation((progress) => okAsync(progress));
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
            executionManager.reportState.mockReset();
          });

          test("THEN the Progress Reporter should be called with the expected Progress", async () => {
            const expectedExecutionState = useCase
              .executionStateFrom({
                executionId: VALID_EXECUTION_ID,
                renderProgress,
                startExecutionState: useCase.START_ENGINE_PROGRESS,
                endExecutionState: useCase.END_ENGINE_PROGRESS,
              })
              ._unsafeUnwrap();

            await useCase.execute(VALID_EXECUTION_ID, VALID_RENDER_VIDEO_PARAMS);

            expect(executionManager.reportState).toHaveBeenCalledWith(expectedExecutionState);
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
            executionManager.reportState.mockReset();
          });

          test("THEN the Progress Reporter should NOT be called", async () => {
            await useCase.execute(VALID_EXECUTION_ID, VALID_RENDER_VIDEO_PARAMS);

            expect(executionManager.reportState).not.toHaveBeenCalled();
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
          executionManager.reportState.mockReset();
        });

        test("THEN the Progress Reporter should be called only once", async () => {
          const expectedExecutionState = useCase
            .executionStateFrom({
              executionId: VALID_EXECUTION_ID,
              renderProgress: 0.1,
              startExecutionState: useCase.START_ENGINE_PROGRESS,
              endExecutionState: useCase.END_ENGINE_PROGRESS,
            })
            ._unsafeUnwrap();

          await useCase.execute(VALID_EXECUTION_ID, VALID_RENDER_VIDEO_PARAMS);

          expect(executionManager.reportState).toHaveBeenCalledTimes(1);
          expect(executionManager.reportState).toHaveBeenCalledWith(expectedExecutionState);
        });
      });
    });
  });
});
