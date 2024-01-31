import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { NetworkError } from "@core/errors/NetworkError";
import { MessageSender } from "@core/messageSender";
import { ResultAsync, fromPromise } from "neverthrow";

export class SQSQueue<TMessage> implements MessageSender<TMessage> {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
  ) {}

  send(message: TMessage): ResultAsync<TMessage, NetworkError> {
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
    });

    return fromPromise(
      this.sqsClient.send(sendMessageCommand),
      (error) => new NetworkError("Failed to send message", error instanceof Error ? error : undefined),
    ).map(() => message);
  }
}
