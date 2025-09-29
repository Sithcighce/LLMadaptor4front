// ChatRequest type for LlmClient
import type { ChatMessage } from './ChatMessage';

export type ChatRequest = {
  messages: ChatMessage[];
  stream?: boolean;
  params?: Record<string, unknown>;
};

export type ChatResult = {
  text: string;
  usage: {
    input: number;
    output: number;
  };
  stop_reason: string;
  tool_calls?: unknown;
  raw: unknown;
};

export type StreamChunk = {
  text: string;
  raw: unknown;
};

export type StreamingChatResult = {
  stream: AsyncGenerator<StreamChunk>;
  usage: Promise<unknown>;
  final: Promise<unknown>;
};
