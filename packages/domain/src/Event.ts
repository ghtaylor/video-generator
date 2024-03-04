import { z } from "zod";

export const EventName = z.enum(["executionUpdated"]);

export type EventName = z.infer<typeof EventName>;
