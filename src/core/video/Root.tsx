import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import "./style.css";
import { exampleData } from "./example";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="video"
        component={MyComposition}
        durationInFrames={exampleData.chunks.length * 60}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
