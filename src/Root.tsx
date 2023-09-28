import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import "./style.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Root"
        component={MyComposition}
        defaultProps={{
          vidUrl: "",
        }}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
