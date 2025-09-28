/**
 * Message format for Google Gemini.
 */
type GeminiProviderMessage = {
	role: 'user' | 'model';
	parts: Array<{
		text: string;
	}>;
};

export type { GeminiProviderMessage };
