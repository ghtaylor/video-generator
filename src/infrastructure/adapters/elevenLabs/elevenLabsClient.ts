import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { ResultAsync, fromPromise } from "neverthrow";
import { WebSocket } from "ws";
import { ElevenLabsWSResponse } from "./schema";
import { ElevenLabsConfig } from "./config";

export class ElevenLabsClient {
  constructor(private readonly config: ElevenLabsConfig) {}

  getWebSocketResponses(text: string): ResultAsync<ElevenLabsWSResponse[], NetworkError | ParseError> {
    return fromPromise(
      this.getWebSocketResponsesPromise(text),
      (error) => new NetworkError("ElevenLabs API error", error instanceof Error ? error : undefined),
    );
  }

  getWebSocketResponsesPromise(text: string): Promise<ElevenLabsWSResponse[]> {
    return new Promise((resolve, reject) => {
      const responses: ElevenLabsWSResponse[] = [];

      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}/stream-input?modelId=${this.config.modelId}`,
        {
          headers: {
            "xi-api-key": this.config.apiKey,
          },
        },
      );

      ws.onopen = () => {
        const bosMessage = {
          text: " ",
          voice_settings: {
            stability: 0.5,
            similarity_boost: true,
          },
        };

        ws.send(JSON.stringify(bosMessage));

        const textMessage = {
          text,
          try_trigger_generation: true,
        };

        ws.send(JSON.stringify(textMessage));

        const eosMessage = {
          text: "",
        };

        ws.send(JSON.stringify(eosMessage));
      };

      ws.onmessage = (event) => {
        const response = ElevenLabsWSResponse.parse(JSON.parse(event.data.toString()));
        responses.push(response);

        if (response.isFinal) {
          ws.close();
        }
      };

      ws.onclose = () => {
        resolve(responses);
      };

      ws.onerror = (error) => {
        reject(error);
      };
    });
  }
}
