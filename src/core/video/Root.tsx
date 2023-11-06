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
        calculateMetadata={({ props: renderVideoParams }) => ({
          durationInFrames: renderVideoParams.sections.reduce((acc, { durationInFrames }) => acc + durationInFrames, 0),
        })}
        defaultProps={{
          fps: 30,
          speechAudioUrl: "",
          sections: [],
          metadata: {
            title: "",
            description: ""
          }
        }}
      />
    </>
  );
};
