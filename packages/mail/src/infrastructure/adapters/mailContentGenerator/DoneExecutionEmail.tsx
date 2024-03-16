import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { DoneExecution } from "@video-generator/domain/Execution";
import * as React from "react";

interface DoneExecutionEmailProps {
  execution: DoneExecution;
  videoDownloadUrl: string;
}

export const DONE_EXECUTION_EMAIL_SUBJECT = "Your video download is ready.";

const DoneExecutionEmail = ({ execution: { id, renderedVideo }, videoDownloadUrl }: DoneExecutionEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{DONE_EXECUTION_EMAIL_SUBJECT}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-8 mx-auto p-8 max-w-[465px]">
            <Section className="text-center">
              <Text className="text-5xl">🎉</Text>
            </Section>
            <Heading className="text-black text-2xl text-center p-0 font-normal mt-2">
              {DONE_EXECUTION_EMAIL_SUBJECT}
            </Heading>
            <Text className="text-black text-sm leading-relaxed mt-6">
              An AI generated video was recently rendered for you. You can download it below.
            </Text>
            <Hr />
            <Text className="text-black text-sm leading-relaxed">
              <span className="font-bold">Title:</span> {renderedVideo.metadata.title}
            </Text>
            <Text className="text-black text-sm -mt-3 leading-relaxed">
              <span className="font-bold">Description:</span> {renderedVideo.metadata.description}
            </Text>
            <Section className="text-center my-8">
              <Button className="bg-blue-500 text-white text-sm px-3 py-2 rounded" href={videoDownloadUrl}>
                Download
              </Button>
            </Section>
            <Text className="text-black text-sm leading-relaxed mb-0">
              Or copy and paste the following link into your browser:{" "}
              <Link href={videoDownloadUrl}>{videoDownloadUrl}</Link>
            </Text>
          </Container>
          <Container className="max-w-[465px] mx-auto text-center">
            <Text className="text-xs text-gray-500">
              Video Generator by George Taylor.{" "}
              <Link href="https://github.com/ghtaylor">https://github.com/ghtaylor</Link>
            </Text>
            <Text className="text-xs text-gray-500 -mt-3">
              <span className="font-bold">Execution ID:</span> {id}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DoneExecutionEmail.PreviewProps = {
  execution: {
    id: "46b50e28-04d0-4978-93f0-66c884347b58",
    status: "DONE",
    renderedVideo: {
      videoPath: "path/to/video.mp4",
      metadata: {
        title: "A video title",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, nesciunt? Repellat placeat sed quis! Tempora reprehenderit, facilis soluta minima quam corrupti eaque provident sunt autem aspernatur inventore libero magnam ipsa?",
      },
    },
  },
  videoDownloadUrl: "https://example.com/path/to/video.mp4",
} satisfies DoneExecutionEmailProps;

export default DoneExecutionEmail;
