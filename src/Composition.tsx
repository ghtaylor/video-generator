import { AbsoluteFill, staticFile, Video } from "remotion";

export const MyComposition: React.FC<{
  vidUrl: string;
}> = ({ vidUrl }) => {
  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Video src={vidUrl} />
      </AbsoluteFill>
      <AbsoluteFill>
        <h1>This text is written on top!</h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
