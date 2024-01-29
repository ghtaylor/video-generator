import { loadFont } from "@remotion/google-fonts/Playfair";
import { RenderVideoParams } from "@video-generator/domain/Video";
import { AbsoluteFill, Audio, OffthreadVideo, Series } from "remotion";

const { fontFamily } = loadFont();

export const MyComposition: React.FC<RenderVideoParams> = ({ sections, speechAudioUrl, musicAudioUrl }) => {
  return (
    <>
      <Series>
        {sections.map(({ text, durationInFrames, backgroundVideoUrl }) => (
          <Series.Sequence key={text} durationInFrames={durationInFrames} className="items-center justify-center">
            <AbsoluteFill className="-z-50 bg-black">
              <OffthreadVideo
                src={backgroundVideoUrl}
                className="object-cover relative opacity-50 grayscale contrast-150"
                muted={true}
              />
            </AbsoluteFill>

            <h1
              className="text-5xl font-light text-white leading-tight text-center drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] p-24"
              style={{ fontFamily }}
            >
              {text}
            </h1>
          </Series.Sequence>
        ))}
      </Series>
      <Audio src={speechAudioUrl} />
      <Audio src={musicAudioUrl} volume={0.4} />
    </>
  );
};
