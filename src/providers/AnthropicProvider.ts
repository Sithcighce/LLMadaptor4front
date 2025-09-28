import { AnthropicProviderConfig } from '../types/provider-config/AnthropicProviderConfig';
import { Provider } from '../types/Provider';
import { ChatMessage } from '../types/ChatMessage';
import { AnthropicProviderMessage } from '../types/provider-message/AnthropicProviderMessage';

/**
 * Provider for Anthropic’s Claude API, supporting direct and proxy modes.
 */
class AnthropicProvider implements Provider {
  private method!: string;
  private endpoint!: string;
  private headers!: Record<string, unknown>;
  private bodyExtras!: Record<string, unknown>;
  private systemMessage?: string;
  private responseFormat!: 'stream' | 'json';
  private maxOutputTokens!: number;
  private anthropicVersion!: string;
  private messageParser?: (messages: ChatMessage[]) => AnthropicProviderMessage[];
  private debug = false;

  public constructor(config: AnthropicProviderConfig) {
    this.method = config.method ?? 'POST';
    this.systemMessage = config.systemMessage;
    this.responseFormat = config.responseFormat ?? 'stream';
    this.maxOutputTokens = config.maxOutputTokens ?? 1024;
    this.anthropicVersion = config.anthropicVersion ?? '2023-06-01';
    this.messageParser = config.messageParser;
    this.debug = config.debug ?? false;
    this.bodyExtras = config.body ?? {};
    this.headers = {
      'Content-Type': 'application/json',
      Accept: this.responseFormat === 'stream' ? 'text/event-stream' : 'application/json',
      ...config.headers,
    };

    if (config.mode === 'direct') {
      this.endpoint = config.baseUrl ?? 'https://api.anthropic.com/v1/messages';
      this.headers = {
        ...this.headers,
        'x-api-key': config.apiKey,
        'anthropic-version': this.anthropicVersion,
      };
    } else if (config.mode === 'proxy') {
      this.endpoint = config.baseUrl;
    } else {
      throw new Error("Invalid mode specified for Anthropic provider ('direct' or 'proxy').");
    }

    this.bodyExtras = {
      max_output_tokens: this.maxOutputTokens,
      stream: this.responseFormat === 'stream',
      model: config.model,
      ...this.bodyExtras,
    };
  }

  public async *sendMessages(messages: ChatMessage[]): AsyncGenerator<string> {
    const requestBody = this.constructBodyWithMessages(messages);

    if (this.debug) {
      const sanitizedHeaders = { ...this.headers };
      if (sanitizedHeaders['x-api-key']) {
        sanitizedHeaders['x-api-key'] = '[REDACTED]';
      }
      console.log('[AnthropicProvider] Request:', {
        method: this.method,
        endpoint: this.endpoint,
        headers: sanitizedHeaders,
        body: requestBody,
      });
    }

    const res = await fetch(this.endpoint, {
      method: this.method,
      headers: this.headers as HeadersInit,
      body: JSON.stringify(requestBody),
    });

    if (this.debug) {
      console.log('[AnthropicProvider] Response status:', res.status);
    }

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
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
        console.log('[AnthropicProvider] Response body:', payload);
      }
      const text = payload.content?.[0]?.text ?? payload.content?.[0]?.delta?.text;
      if (typeof text === 'string') {
        yield text;
      } else {
        throw new Error('Unexpected response shape – no text candidate');
      }
    }
  }

  private toProviderMessages(messages: ChatMessage[]): AnthropicProviderMessage[] {
    if (this.messageParser) {
      return this.messageParser(messages);
    }

    return messages
      .filter((message) => typeof message.content === 'string')
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: [
          {
            type: 'text' as const,
            text: message.content,
          },
        ],
      }));
  }

  private collectSystemMessage(messages: ChatMessage[]): string | undefined {
    const inlineSystemMessages = messages
      .filter((message) => message.role === 'system' && typeof message.content === 'string')
      .map((message) => message.content.trim())
      .filter(Boolean);

    const combined = [this.systemMessage, ...inlineSystemMessages].filter(Boolean).join('\n\n');
    return combined.length ? combined : undefined;
  }

  private constructBodyWithMessages(messages: ChatMessage[]) {
    const requestBody: Record<string, unknown> = {
      messages: this.toProviderMessages(messages),
      ...this.bodyExtras,
    };

    const system = this.collectSystemMessage(messages);
    if (system) {
      requestBody.system = system;
    }

    return requestBody;
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
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const evt of events) {
        let eventType = '';
        for (const line of evt.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            eventType = trimmed.slice('event:'.length).trim();
            continue;
          }

          if (!trimmed.startsWith('data:')) {
            continue;
          }

          const data = trimmed.slice('data:'.length).trim();
          if (!data || data === '[DONE]') {
            if (eventType === 'message_stop' || data === '[DONE]') {
              return;
            }
            continue;
          }

          try {
            const payload = JSON.parse(data);
            if (eventType === 'content_block_delta') {
              const text = payload.delta?.text ?? payload.delta?.partial_text;
              if (typeof text === 'string') {
                yield text;
              }
            } else if (eventType === 'message_delta') {
              const text = payload.delta?.text;
              if (typeof text === 'string') {
                yield text;
              }
            }
          } catch (error) {
            console.error('Claude stream parse error', { eventType, data, error });
          }
        }
      }
    }
  }
}

export default AnthropicProvider;

