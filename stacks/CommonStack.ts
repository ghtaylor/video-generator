import { EventBus, StackContext } from "sst/constructs";

export function CommonStack({ stack }: StackContext) {
  const eventBus = new EventBus(stack, "EventBus");

  return {
    eventBus,
  };
}
