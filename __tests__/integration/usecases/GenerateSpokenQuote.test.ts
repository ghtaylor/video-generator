import { NetworkError } from "@core/errors/NetworkError";
import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpeechService } from "@core/speechService";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { Quote } from "@domain/Quote";
import { Speech } from "@domain/Speech";
import { SpokenQuote } from "@domain/SpokenQuote";
import { SpokenQuoteMarksInvalidError } from "@domain/errors/SpokenQuote";
import { mock } from "jest-mock-extended";
import { err, errAsync, ok, okAsync } from "neverthrow";

const speechService = mock<SpeechService>();
const fileStore = mock<FileStore>();
const spokenQuoteQueue = mock<Queue<SpokenQuote>>();

const generateSpokenQuoteUseCase = new GenerateSpokenQuoteUseCase(speechService, fileStore, spokenQuoteQueue);

describe("GenerateSpokenQuote Use Case", () => {
  describe("GIVEN the SpeechService successfully generates Speech", () => {
    const speech: Speech = {
      audio: Buffer.from("audio"),
      marks: [
        {
          value: "this",
          start: 0,
          end: 120,
        },
        {
          value: "is",
          start: 120,
          end: 240,
        },
        {
          value: "an",
          start: 240,
          end: 360,
        },
        {
          value: "example",
          start: 360,
          end: 480,
        },
      ],
    };

    beforeEach(() => {
      speechService.generateSpeech.mockReturnValue(okAsync(speech));
    });

    describe("AND the FileStore successfully stores the Speech audio", () => {
      const audioLocation = "audioLocation";

      beforeEach(() => {
        fileStore.store.mockReturnValue(okAsync(audioLocation));
      });

      describe("AND the SpokenQuote is successfully created", () => {
        const spokenQuote: SpokenQuote = {
          text: "This is an example",
          chunks: [
            {
              value: "This is an example",
              start: 0,
              end: 480,
            },
          ],
          audioLocation,
        };

        beforeEach(() => {
          jest.spyOn(generateSpokenQuoteUseCase, "createSpokenQuote").mockReturnValue(ok(spokenQuote));
        });

        describe("AND the SpokenQuoteQueue successfully enqueues the SpokenQuote", () => {
          beforeEach(() => {
            spokenQuoteQueue.enqueue.mockReturnValue(okAsync(spokenQuote));
          });

          describe("WHEN the GenerateSpokenQuote Use Case is executed with a Quote", () => {
            const quote: Quote = {
              text: "This is an example",
              chunks: ["This is an example"],
            };

            test("THEN the SpeechService should be called to generate a Speech", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(speechService.generateSpeech).toHaveBeenCalledWith(quote.text);
            });

            test("THEN the FileStore should be called to store the Speech audio", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(fileStore.store).toHaveBeenCalledWith(speech.audio);
            });

            test("THEN `createSpokenQuote` should be called to create the SpokenQuote", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(generateSpokenQuoteUseCase.createSpokenQuote).toHaveBeenCalledWith(quote, speech, audioLocation);
            });

            test("THEN the SpokenQuote should be added to the SpokenQuoteQueue", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(spokenQuoteQueue.enqueue).toHaveBeenCalledWith(spokenQuote);
            });

            test("THEN the execution should return the SpokenQuote, meaning success", async () => {
              await expect(generateSpokenQuoteUseCase.execute(quote)).resolves.toEqual(ok(spokenQuote));
            });
          });
        });

        describe("AND the SpokenQuoteQueue fails to enqueue the SpokenQuote due to a NetworkError", () => {
          const networkError = new NetworkError();

          beforeEach(() => {
            spokenQuoteQueue.enqueue.mockReturnValue(errAsync(networkError));
          });

          describe("WHEN the GenerateSpokenQuote Use Case is executed with a Quote", () => {
            const quote: Quote = {
              text: "This is an example",
              chunks: ["This is an example"],
            };

            test("THEN the SpeechService should be called to generate a Speech", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(speechService.generateSpeech).toHaveBeenCalledWith(quote.text);
            });

            test("THEN the FileStore should be called to store the Speech audio", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(fileStore.store).toHaveBeenCalledWith(speech.audio);
            });

            test("THEN `createSpokenQuote` should be called to create the SpokenQuote", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(generateSpokenQuoteUseCase.createSpokenQuote).toHaveBeenCalledWith(quote, speech, audioLocation);
            });

            test("THEN the SpokenQuote should be added to the SpokenQuoteQueue", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(spokenQuoteQueue.enqueue).toHaveBeenCalledWith(spokenQuote);
            });

            test("THEN the execution should return a NetworkError", async () => {
              await expect(generateSpokenQuoteUseCase.execute(quote)).resolves.toEqual(err(networkError));
            });
          });
        });

        describe("AND the SpokenQuoteQueue fails to enqueue the SpokenQuote due to an UnknownError", () => {
          const unknownError = new NetworkError();

          beforeEach(() => {
            spokenQuoteQueue.enqueue.mockReturnValue(errAsync(unknownError));
          });

          describe("WHEN the GenerateSpokenQuote Use Case is executed with a Quote", () => {
            const quote: Quote = {
              text: "This is an example",
              chunks: ["This is an example"],
            };

            test("THEN the SpeechService should be called to generate a Speech", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(speechService.generateSpeech).toHaveBeenCalledWith(quote.text);
            });

            test("THEN the FileStore should be called to store the Speech audio", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(fileStore.store).toHaveBeenCalledWith(speech.audio);
            });

            test("THEN `createSpokenQuote` should be called to create the SpokenQuote", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(generateSpokenQuoteUseCase.createSpokenQuote).toHaveBeenCalledWith(quote, speech, audioLocation);
            });

            test("THEN the SpokenQuote should be added to the SpokenQuoteQueue", async () => {
              await generateSpokenQuoteUseCase.execute(quote);
              expect(spokenQuoteQueue.enqueue).toHaveBeenCalledWith(spokenQuote);
            });

            test("THEN the execution should return an UnknownError", async () => {
              await expect(generateSpokenQuoteUseCase.execute(quote)).resolves.toEqual(err(unknownError));
            });
          });
        });
      });

      describe("AND the SpokenQuote fails to be created, due to a SpokenQuoteMarksInvalidError", () => {
        const spokenQuoteMarksInvalidError = new SpokenQuoteMarksInvalidError();

        beforeEach(() => {
          jest
            .spyOn(generateSpokenQuoteUseCase, "createSpokenQuote")
            .mockReturnValue(err(spokenQuoteMarksInvalidError));
        });

        describe("WHEN the GenerateSpokenQuote Use Case is executed with a Quote", () => {
          const quote: Quote = {
            text: "This is an example",
            chunks: ["This is an example"],
          };

          test("THEN the SpeechService should be called to generate a Speech", async () => {
            await generateSpokenQuoteUseCase.execute(quote);
            expect(speechService.generateSpeech).toHaveBeenCalledWith(quote.text);
          });

          test("THEN the FileStore should be called to store the Speech audio", async () => {
            await generateSpokenQuoteUseCase.execute(quote);
            expect(fileStore.store).toHaveBeenCalledWith(speech.audio);
          });

          test("THEN `createSpokenQuote` should be called to create the SpokenQuote", async () => {
            await generateSpokenQuoteUseCase.execute(quote);
            expect(generateSpokenQuoteUseCase.createSpokenQuote).toHaveBeenCalledWith(quote, speech, audioLocation);
          });

          test("THEN the execution should return a SpokenQuoteMarksInvalidError", async () => {
            await expect(generateSpokenQuoteUseCase.execute(quote)).resolves.toEqual(err(spokenQuoteMarksInvalidError));
          });
        });
      });
    });

    describe("AND the FileStore fails to store the Speech audio due to a NetworkError", () => {
      const networkError = new NetworkError();

      beforeEach(() => {
        fileStore.store.mockReturnValue(errAsync(networkError));
      });

      describe("WHEN the GenerateSpokenQuote Use Case is executed with a Quote", () => {
        const quote: Quote = {
          text: "This is an example",
          chunks: ["This is an example"],
        };

        test("THEN the SpeechService should be called to generate a Speech", async () => {
          await generateSpokenQuoteUseCase.execute(quote);
          expect(speechService.generateSpeech).toHaveBeenCalledWith(quote.text);
        });

        test("THEN the FileStore should be called to store the Speech audio", async () => {
          await generateSpokenQuoteUseCase.execute(quote);
          expect(fileStore.store).toHaveBeenCalledWith(speech.audio);
        });

        test("THEN the execution should return a NetworkError", async () => {
          await expect(generateSpokenQuoteUseCase.execute(quote)).resolves.toEqual(err(networkError));
        });
      });
    });

    describe("AND the FileStore fails to store the Speech audio due to an UnknownError", () => {
      const unknownError = new NetworkError();

      beforeEach(() => {
        fileStore.store.mockReturnValue(errAsync(unknownError));
      });

      describe("WHEN the GenerateSpokenQuote Use Case is executed with a Quote", () => {
        const quote: Quote = {
          text: "This is an example",
          chunks: ["This is an example"],
        };

        test("THEN the SpeechService should be called to generate a Speech", async () => {
          await generateSpokenQuoteUseCase.execute(quote);
          expect(speechService.generateSpeech).toHaveBeenCalledWith(quote.text);
        });

        test("THEN the FileStore should be called to store the Speech audio", async () => {
          await generateSpokenQuoteUseCase.execute(quote);
          expect(fileStore.store).toHaveBeenCalledWith(speech.audio);
        });

        test("THEN the execution should return an UnknownError", async () => {
          await expect(generateSpokenQuoteUseCase.execute(quote)).resolves.toEqual(err(unknownError));
        });
      });
    });
  });
});
