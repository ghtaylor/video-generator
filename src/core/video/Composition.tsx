import { VideoOptions } from "@domain/Video";
import { AbsoluteFill, Audio, OffthreadVideo, Series, staticFile } from "remotion";

export const MyComposition: React.FC<VideoOptions> = ({ sections, speechAudioUrl }) => {
  return (
    <>
      <Series>
        {sections.map(({ text, durationInFrames, backgroundVideoUrl }) => (
          <Series.Sequence key={text} durationInFrames={durationInFrames} className="items-center justify-center">
            <AbsoluteFill className="-z-50">
              <OffthreadVideo src={backgroundVideoUrl} />
            </AbsoluteFill>

            <h1 className="text-7xl tracking-wider font-bold text-white text-center drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
              {text}
            </h1>
          </Series.Sequence>
        ))}
      </Series>
      <Audio src={speechAudioUrl} />
    </>
  );
};
