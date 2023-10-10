import { AbsoluteFill, RandomSeed, Series, Video, random, staticFile } from "remotion";
import { exampleData } from "./example";

export const MyComposition: React.FC = () => {
  const videoUrls = ["1.mp4", "2.mp4", "3.mp4", "4.mp4"];

  const getRandomVideoUrl = (seed: RandomSeed) => {
    const randomIndex = Math.floor(random(seed) * videoUrls.length);
    return videoUrls[randomIndex];
  };

  return (
    <Series>
      {exampleData.chunks.map((quoteChunk) => (
        <Series.Sequence key={quoteChunk} durationInFrames={60} className="items-center justify-center">
          <AbsoluteFill className="-z-50">
            <Video src={staticFile(getRandomVideoUrl(quoteChunk))} />
          </AbsoluteFill>

          <h1 className="text-7xl tracking-wider font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
            {quoteChunk}
          </h1>
        </Series.Sequence>
      ))}
    </Series>
  );
};
