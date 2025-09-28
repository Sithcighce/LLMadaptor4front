type AnthropicProviderMessage = {
	role: 'user' | 'assistant';
	content: Array<{
		type: 'text';
		text: string;
	}>;
};

export type { AnthropicProviderMessage };
