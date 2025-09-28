import { ChatMessage } from '../types/ChatMessage';

type ChatRequest = {
	messages: ChatMessage[];
	stream?: boolean;
	signal?: AbortSignal;
	onChunk?: (chunk: string) => void;
};

type StreamChatResult = {
	type: 'stream';
	stream: AsyncGenerator<string>;
};

type TextChatResult = {
	type: 'text';
	text: string;
};

type ChatResult = StreamChatResult | TextChatResult;

type LlmClient = {
	chat(request: ChatRequest): Promise<ChatResult>;
};

export type { ChatRequest, ChatResult, StreamChatResult, TextChatResult, LlmClient };
