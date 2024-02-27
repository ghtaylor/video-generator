import { z } from "zod";

export const EventName = z.enum(["executionStateChanged", "foo"]);

export type EventName = z.infer<typeof EventName>;
