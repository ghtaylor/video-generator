export type SpeechMark = {
  value: string;
  start: number;
  end: number;
};

export type Speech = {
  audio: Buffer;
  marks: SpeechMark[];
};
