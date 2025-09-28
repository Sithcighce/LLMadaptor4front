import { GeminiProviderConfig } from '../types/provider-config/GeminiProviderConfig';
import { Provider } from '../types/Provider';
import { ChatMessage } from '../types/ChatMessage';
import { GeminiProviderMessage } from '../types/provider-message/GeminiProviderMessage';

/**
 * Provider for Gemini’s API, supports both direct and proxy modes.
 */
class GeminiProvider implements Provider {
  private method!: string;
  private endpoint!: string;
  private headers!: Record<string, unknown>;
  private body!: Record<string, unknown>;
  private systemMessage?: string;
  private responseFormat!: 'stream' | 'json';
  private messageParser?: (messages: ChatMessage[]) => GeminiProviderMessage[];
  private debug = false;

  public constructor(config: GeminiProviderConfig) {
    this.method = config.method ?? 'POST';
    this.body = config.body ?? {};
    this.systemMessage = config.systemMessage;
    this.responseFormat = config.responseFormat ?? 'stream';
    this.messageParser = config.messageParser;
    this.debug = config.debug ?? false;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: this.responseFormat === 'stream' ? 'text/event-stream' : 'application/json',
      ...config.headers,
    };

    const baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    if (config.mode === 'direct') {
      this.endpoint =
        this.responseFormat === 'stream'
          ? `${baseUrl}/models/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey || ''}`
          : `${baseUrl}/models/${config.model}:generateContent?key=${config.apiKey || ''}`;
    } else if (config.mode === 'proxy') {
      this.endpoint = `${baseUrl}/${config.model}`;
    } else {
      throw new Error("Invalid mode specified for Gemini provider ('direct' or 'proxy').");
    }
  }

  public async *sendMessages(messages: ChatMessage[]): AsyncGenerator<string> {
    if (this.debug) {
      const sanitizedEndpoint = this.endpoint.replace(/\?key=([^&]+)/, '?key=[REDACTED]');
      const sanitizedHeaders = { ...this.headers };
      console.log('[GeminiProvider] Request:', {
        method: this.method,
        endpoint: sanitizedEndpoint,
        headers: sanitizedHeaders,
        body: this.constructBodyWithMessages(messages),
      });
    }

    const res = await fetch(this.endpoint, {
      method: this.method,
      headers: this.headers as HeadersInit,
      body: JSON.stringify(this.constructBodyWithMessages(messages)),
    });

    if (this.debug) {
      console.log('[GeminiProvider] Response status:', res.status);
    }

    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
    }

    if (this.responseFormat === 'stream') {
      if (!res.body) {
        throw new Error('Response body is empty – cannot stream');
      }
      const reader = res.body.getReader();
      for await (const chunk of this.handleStreamResponse(reader)) {
        yield chunk;
      }
    } else {
      const payload = await res.json();
      if (this.debug) {
        console.log('[GeminiProvider] Response body:', payload);
      }
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') {
        yield text;
      } else {
        throw new Error('Unexpected response shape – no text candidate');
      }
    }
  }

  private toProviderRole(role: ChatMessage['role']): 'user' | 'model' {
    return role === 'assistant' ? 'model' : 'user';
  }

  private constructBodyWithMessages(messages: ChatMessage[]) {
    let parsedMessages: GeminiProviderMessage[];
    if (this.messageParser) {
      parsedMessages = this.messageParser(messages);
    } else {
      parsedMessages = messages
        .filter((message) => typeof message.content === 'string')
        .map((message) => ({
          role: this.toProviderRole(message.role),
          parts: [{ text: message.content }],
        }));
    }

    if (this.systemMessage) {
      parsedMessages = [{ role: 'user', parts: [{ text: this.systemMessage }] }, ...parsedMessages];
    }

    return {
      contents: parsedMessages,
      ...this.body,
    };
  }

  private async *handleStreamResponse(
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>
  ): AsyncGenerator<string> {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) {
          continue;
        }

        const jsonText = trimmed.slice('data: '.length);
        try {
          const evt = JSON.parse(jsonText);
          const chunk = evt.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) {
            yield chunk;
          }
        } catch (error) {
          console.error('SSE JSON parse error:', jsonText, error);
        }
      }
    }
  }
}

export default GeminiProvider;

