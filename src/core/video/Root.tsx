import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import "./style.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="video"
        component={MyComposition}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={({ props: videoOptions }) => ({
          durationInFrames: videoOptions.sections.reduce((acc, { durationInFrames }) => acc + durationInFrames, 0),
        })}
        defaultProps={{
          fps: 30,
          description: "",
          speechAudioUrl: "",
          sections: [],
        }}
      />
    </>
  );
};
