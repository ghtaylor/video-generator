import { Config, Function, StackContext, use } from "sst/constructs";
import { CommonStack } from "./CommonStack";

export function MailStack({ stack }: StackContext) {
  const MAIL_DIR = "packages/mail";

  const { eventBus, bucket } = use(CommonStack);

  const MAILJET_CONFIG = new Config.Secret(stack, "MAILJET_CONFIG");
  const EMAIL_ADDRESS = new Config.Secret(stack, "EMAIL_ADDRESS");

  const onExecutionUpdatedFunction = new Function(stack, "OnExecutionUpdated", {
    handler: `${MAIL_DIR}/src/infrastructure/handlers/onExecutionUpdated.default`,
    bind: [MAILJET_CONFIG, EMAIL_ADDRESS, bucket],
  });

  eventBus.addTargets(stack, "executionUpdated", {
    sendMailOnExecutionUpdated: onExecutionUpdatedFunction,
  });
}
