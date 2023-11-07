import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { NetworkError } from "@core/errors/NetworkError";
import { MessageSender } from "@core/messageSender";
import { ResultAsync, fromPromise } from "neverthrow";

export class SNSMessageSender<TMessage> implements MessageSender<TMessage> {
  constructor(
    private readonly snsClient: SNSClient,
    private readonly topicArn: string,
  ) {}

  send(message: TMessage): ResultAsync<TMessage, NetworkError> {
    const publishCommand = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(message),
    });

    return fromPromise(
      this.snsClient.send(publishCommand),
      (error) => new NetworkError("Failed to send message", error instanceof Error ? error : undefined),
    ).map(() => message);
  }
}
