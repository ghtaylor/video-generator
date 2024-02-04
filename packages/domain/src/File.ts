import { z } from "zod";

export const FilePath = z.string().describe("Path to the file");
export const FileUrl = z.string().url().describe("URL to the file");

export type FilePath = z.infer<typeof FilePath>;
export type FileUrl = z.infer<typeof FileUrl>;
