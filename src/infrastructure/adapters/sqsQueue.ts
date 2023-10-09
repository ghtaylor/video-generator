import { SQSClient, SQSServiceException, SendMessageCommand } from "@aws-sdk/client-sqs";
import { NetworkError } from "@core/errors/NetworkError";
import { Queue } from "@core/queue";
import { ResultAsync, fromPromise } from "neverthrow";

export class SQSQueue<TMessage> implements Queue<TMessage> {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
  ) {}

  enqueue(message: TMessage): ResultAsync<TMessage, NetworkError> {
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
    });

    SQSServiceException;

    return fromPromise(
      this.sqsClient.send(sendMessageCommand),
      (error) => new NetworkError("Failed to send message", error instanceof Error ? error : undefined),
    ).map(() => message);
  }
}
