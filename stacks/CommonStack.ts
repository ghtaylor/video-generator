import { Bucket, EventBus, StackContext } from "sst/constructs";

export function CommonStack({ stack }: StackContext) {
  const eventBus = new EventBus(stack, "EventBus");
  const bucket = new Bucket(stack, "Bucket");

  return {
    eventBus,
    bucket,
  };
}
