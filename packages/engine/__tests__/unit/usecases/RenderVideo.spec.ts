import { EventSender } from "@core/eventSender";
import { FileStore } from "@core/fileStore";
import { RenderVideoUseCase, SendExecutionChangedParams } from "@core/usecases/RenderVideo";
import { VideoRenderer } from "@core/videoRenderer";
import { RenderVideoParams } from "@video-generator/domain/Video";
import { okAsync } from "neverthrow";
import { mock } from "vitest-mock-extended";

type ExpectedExecution = number;
type RenderProgress = number;

describe("RenderVideo Use Case - Unit Tests", () => {
  const videoRenderer = mock<VideoRenderer>();
  const fileStore = mock<FileStore>();
  const eventSender = mock<EventSender>();

  const useCase = new RenderVideoUseCase(videoRenderer, fileStore, eventSender);

  const VALID_EXECUTION_ID = "id";

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
    describe.each<[SendExecutionChangedParams, ExpectedExecution]>([
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0,
          startExecutionProgress: 0.75,
          endExecutionProgress: 0.95,
        },
        0.75,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.25,
          startExecutionProgress: 0.75,
          endExecutionProgress: 0.95,
        },
        0.8,
      ],

      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.5,
          startExecutionProgress: 0.75,
          endExecutionProgress: 0.95,
        },
        0.85,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.75,
          startExecutionProgress: 0.75,
          endExecutionProgress: 0.95,
        },
        0.9,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 1,
          startExecutionProgress: 0.75,
          endExecutionProgress: 0.95,
        },
        0.95,
      ],

      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0,
          startExecutionProgress: 0,
          endExecutionProgress: 1,
        },
        0,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.25,
          startExecutionProgress: 0,
          endExecutionProgress: 1,
        },
        0.25,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.5,
          startExecutionProgress: 0,
          endExecutionProgress: 1,
        },
        0.5,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.75,
          startExecutionProgress: 0,
          endExecutionProgress: 1,
        },
        0.75,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 1,
          startExecutionProgress: 0,
          endExecutionProgress: 1,
        },
        1,
      ],

      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0,
          startExecutionProgress: 0.75,
          endExecutionProgress: 1,
        },
        0.75,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.25,
          startExecutionProgress: 0.75,
          endExecutionProgress: 1,
        },
        0.81,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.5,
          startExecutionProgress: 0.75,
          endExecutionProgress: 1,
        },
        0.88,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 0.75,
          startExecutionProgress: 0.75,
          endExecutionProgress: 1,
        },
        0.94,
      ],
      [
        {
          executionId: VALID_EXECUTION_ID,
          renderProgress: 1,
          startExecutionProgress: 0.75,
          endExecutionProgress: 1,
        },
        1,
      ],
    ])(
      "GIVEN render progress is %s, start total progress is %s and end engine progress is %s",
      (sendExecutionChangedParams, expectedExecution) => {
        it(`THEN the expected total engine progress should be ${expectedExecution}`, () => {
          const result = useCase.executionStateFrom(sendExecutionChangedParams);
          expect(result._unsafeUnwrap().progress).toEqual(expectedExecution);
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
        eventSender.sendEvent.mockImplementation((_, event) => okAsync(event));
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
            eventSender.sendEvent.mockReset();
          });

          test("THEN the Progress Reporter should be called with the expected Progress", async () => {
            const expectedExecution = useCase
              .executionStateFrom({
                executionId: VALID_EXECUTION_ID,
                renderProgress,
                startExecutionProgress: useCase.START_EXECUTION_STATE_PROGRESS,
                endExecutionProgress: useCase.END_EXECUTION_STATE_PROGRESS,
              })
              ._unsafeUnwrap();

            await useCase.execute(VALID_EXECUTION_ID, VALID_RENDER_VIDEO_PARAMS);

            expect(eventSender.sendEvent).toHaveBeenCalledWith("executionStateChanged", expectedExecution);
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
            eventSender.sendEvent.mockReset();
          });

          test("THEN the Progress Reporter should NOT be called", async () => {
            await useCase.execute(VALID_EXECUTION_ID, VALID_RENDER_VIDEO_PARAMS);

            expect(eventSender.sendEvent).not.toHaveBeenCalled();
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
          eventSender.sendEvent.mockReset();
        });

        test("THEN the Progress Reporter should be called only once", async () => {
          const expectedExecution = useCase
            .executionStateFrom({
              executionId: VALID_EXECUTION_ID,
              renderProgress: 0.1,
              startExecutionProgress: useCase.START_EXECUTION_STATE_PROGRESS,
              endExecutionProgress: useCase.END_EXECUTION_STATE_PROGRESS,
            })
            ._unsafeUnwrap();

          await useCase.execute(VALID_EXECUTION_ID, VALID_RENDER_VIDEO_PARAMS);

          expect(eventSender.sendEvent).toHaveBeenCalledTimes(1);
          expect(eventSender.sendEvent).toHaveBeenCalledWith("executionStateChanged", expectedExecution);
        });
      });
    });
  });
});
