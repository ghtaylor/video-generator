import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { ServiceError } from "@core/errors/ServiceError";
import { MessageSender } from "@core/messageSender";
import { ResultAsync, fromPromise } from "neverthrow";

export class SQSQueue<TMessage> implements MessageSender<TMessage> {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
  ) {}

  send(message: TMessage): ResultAsync<TMessage, ServiceError> {
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
    });

    return fromPromise(
      this.sqsClient.send(sendMessageCommand),
      (error) => new ServiceError("Failed to send message", error instanceof Error ? error : undefined),
    ).map(() => message);
  }
}
