import { SQSClient } from "@aws-sdk/client-sqs";
import { ValidationError } from "@core/errors/ValidationError";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { Quote } from "@domain/Quote";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAIQuoteService";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import { Queue } from "sst/node/queue";

export class GenerateQuoteHandler {
  constructor(private readonly generateQuoteUseCase: GenerateQuoteUseCase) {}

  static build(openAiApiKey: string, quoteQueueUrl: string) {
    const openAIClient = new OpenAI({ apiKey: openAiApiKey });
    const quoteService: QuoteService = new OpenAIQuoteService(openAIClient);

    const sqsClient = new SQSClient({});
    const sqsQueue = new SQSQueue<Quote>(sqsClient, quoteQueueUrl);

    const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, sqsQueue);

    return new GenerateQuoteHandler(generateQuoteUseCase);
  }

  async handle() {
    const result = await this.generateQuoteUseCase.execute();

    if (result.isErr() && result.error instanceof ValidationError) throw result.error;
  }
}

const handlerInstance = GenerateQuoteHandler.build(Config.OPENAI_API_KEY, Queue.Quotes.queueUrl);

export default handlerInstance.handle.bind(handlerInstance);
