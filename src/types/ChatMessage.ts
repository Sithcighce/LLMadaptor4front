/**
 * Minimal message representation shared by all LLM providers.
 */
type ChatMessage = {
	role: 'system' | 'user' | 'assistant' | 'tool' | (string & {});
	content: string;
};

export type { ChatMessage };
