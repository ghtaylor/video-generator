import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { ServiceError } from "@core/errors/ServiceError";
import { MessageSender } from "@core/messageSender";
import { ResultAsync, fromPromise } from "neverthrow";

export class SNSMessageSender<TMessage> implements MessageSender<TMessage> {
  constructor(
    private readonly snsClient: SNSClient,
    private readonly topicArn: string,
  ) {}

  send(message: TMessage): ResultAsync<TMessage, ServiceError> {
    const publishCommand = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(message),
    });

    return fromPromise(
      this.snsClient.send(publishCommand),
      (error) => new ServiceError("Failed to send message", error instanceof Error ? error : undefined),
    ).map(() => message);
  }
}
