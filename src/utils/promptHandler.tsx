import { formatStream } from './streamController';
import { Provider } from '../types/Provider';
import { ChatMessage } from '../types/ChatMessage';
import { Message } from 'react-chatbotify';

/**
 * Speaks the chunk provided before forwarding to output into chatbot.
 *
 * @param stream text stream to speak
 * @param speakAudio utility function for speaking
 */
const speakAndForward = async function* (stream: AsyncGenerator<string>, speakAudio: (text: string) => void) {
	for await (const chunk of stream) {
		speakAudio(chunk);
		yield chunk;
	}
};

/**
 * Maps chatbot message sender to connector role.
 */
const toChatMessageRole = (sender: string): ChatMessage['role'] => {
	switch (sender.toUpperCase()) {
		case 'USER':
			return 'user';
		case 'SYSTEM':
			return 'system';
		default:
			return 'assistant';
	}
};

/**
 * Normalizes React ChatBotify messages into the connector message shape.
 */
const toChatMessages = (messages: Message[]): ChatMessage[] =>
	messages
		.filter((message) => typeof message.content === 'string')
		.map((message) => ({
			role: toChatMessageRole(message.sender ?? ''),
			content: String(message.content),
		}));

/**
 * Processes the prompt using the provided model connector.
 *
 * @param messages messages to send to the LLM
 * @param refs object containing relevant refs
 * @param actions object containing relevant actions
 * @param opts optional AbortSignal
 */
const handlePrompt = async (
	messages: Message[],
	refs: {
		providerRef: React.MutableRefObject<Provider | null>;
		messagesRef: React.MutableRefObject<Message[]>;
		outputTypeRef: React.MutableRefObject<'character' | 'chunk' | 'full'>;
		outputSpeedRef: React.MutableRefObject<number>;
		historySizeRef: React.MutableRefObject<number>;
		initialMessageRef: React.MutableRefObject<string>;
		errorMessageRef: React.MutableRefObject<string>;
		onUserMessageRef: React.MutableRefObject<((msg: Message) => Promise<string | null>) | null>;
		onKeyDownRef: React.MutableRefObject<((e: KeyboardEvent) => Promise<string | null>) | null>;
	},
	actions: {
		speakAudio: (text: string) => void;
		injectMessage: (content: string | JSX.Element, sender?: string) => Promise<Message | null>;
		simulateStreamMessage: (content: string, sender?: string) => Promise<Message | null>;
		streamMessage: (msg: string) => void;
		endStreamMessage: () => void;
		toggleTextAreaDisabled: (active?: boolean) => void;
		toggleIsBotTyping: (active?: boolean) => void;
		focusTextArea: () => void;
		goToPath: (path: string) => void;
		getIsChatBotVisible: () => boolean;
	},
	opts: { signal?: AbortSignal } = {}
): Promise<void> => {
	if (!refs.providerRef.current) {
		return;
	}

	const {
		speakAudio,
		toggleIsBotTyping,
		toggleTextAreaDisabled,
		focusTextArea,
		injectMessage,
		streamMessage,
		endStreamMessage,
		getIsChatBotVisible,
	} = actions;

	const rawStream = refs.providerRef.current.sendMessages(toChatMessages(messages));
	const outputType = refs.outputTypeRef.current;
	const outputSpeed = refs.outputSpeedRef.current;

	// if stream mode is 'full', use 'injectMessage'
	// no need to speak audio as the core library supports audio for 'injectMessage' out of the box
	if (outputType === 'full') {
		let outputContent = '';
		for await (const part of rawStream) {
			if (opts.signal?.aborted) break;
			outputContent += part;
		}

		toggleIsBotTyping(false);
		injectMessage(outputContent);
		setTimeout(() => {
			toggleTextAreaDisabled(false);
			if (getIsChatBotVisible()) {
				focusTextArea();
			}
		});
	} else {
		const formattedStream = formatStream(speakAndForward(rawStream, speakAudio), outputType, outputSpeed);
		let outputContent = '';
		let hasResponded = false;
		for await (const part of formattedStream) {
			if (opts.signal?.aborted) {
				break;
			}
			if (!hasResponded) {
				// once response starts streaming in, disable bot typing
				toggleIsBotTyping(false);
				hasResponded = true;
			}
			outputContent += part;
			streamMessage(outputContent);
		}

		// once response is sent, focus on text area again
		endStreamMessage();
		setTimeout(() => {
			toggleTextAreaDisabled(false);
			if (getIsChatBotVisible()) {
				focusTextArea();
			}
		});
	}
};

export { handlePrompt };
