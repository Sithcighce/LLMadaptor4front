import { Provider } from '../types/Provider';
import { ChatRequest, ChatResult, LlmClient } from './types';

const createLlmClient = (provider: Provider): LlmClient => {
	const chat = async ({ messages, stream = false, signal, onChunk }: ChatRequest): Promise<ChatResult> => {
		let aborted = signal?.aborted ?? false;
		const abortHandler = () => {
			aborted = true;
		};
		signal?.addEventListener('abort', abortHandler, { once: true });

		const baseStream = provider.sendMessages(messages);

		const pipeline = async function* (): AsyncGenerator<string> {
			try {
				for await (const chunk of baseStream) {
					if (aborted) {
						break;
					}
					onChunk?.(chunk);
					yield chunk;
				}
			} finally {
				signal?.removeEventListener('abort', abortHandler);
			}
		};

		if (stream) {
			return { type: 'stream', stream: pipeline() };
		}

		let text = '';
		for await (const chunk of pipeline()) {
			text += chunk;
		}

		return { type: 'text', text };
	};

	return { chat };
};

export { createLlmClient };
