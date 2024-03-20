import {
  Body,
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
import { ErrorExecution } from "@video-generator/domain/Execution";
import * as React from "react";

interface ErrorExecutionEmailProps {
  execution: ErrorExecution;
}

export const ERROR_EXECUTION_EMAIL_SUBJECT = "Your video generation failed.";

const ErrorExecutionEmail = ({ execution: { id, cause } }: ErrorExecutionEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{ERROR_EXECUTION_EMAIL_SUBJECT}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-8 mx-auto p-8 max-w-[465px]">
            <Section className="text-center">
              <Text className="text-5xl">😔</Text>
            </Section>
            <Heading className="text-black text-2xl text-center p-0 font-normal mt-2">
              {ERROR_EXECUTION_EMAIL_SUBJECT}
            </Heading>
            <Text className="text-black text-sm leading-relaxed mt-6">
              An attempt to generate a video for you has failed. You can see the details below.
            </Text>
            <Hr />
            <Text className="text-black text-sm leading-relaxed">
              <span className="font-bold">Error Type:</span> {cause.type}
            </Text>
            <Text className="text-black text-sm -mt-3 leading-relaxed mb-0">
              <span className="font-bold">Error Message:</span> {cause.message}
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

ErrorExecutionEmail.PreviewProps = {
  execution: {
    id: "46b50e28-04d0-4978-93f0-66c884347b58",
    status: "ERROR",
    cause: {
      type: "Error",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur modi, placeat unde molestiae, magni quasi porro quae at dolor voluptate delectus veritatis veniam ea quis assumenda nisi sed quo inventore.",
    },
  },
} satisfies ErrorExecutionEmailProps;

export default ErrorExecutionEmail;
