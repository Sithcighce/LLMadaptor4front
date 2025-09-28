import { Provider } from '../types/Provider';
import { ChatMessage } from '../types/ChatMessage';
import { OpenaiProviderConfig } from '../types/provider-config/OpenaiProviderConfig';
import { OpenaiProviderMessage } from '../types/provider-message/OpenaiProviderMessage';

/**
 * Provider for OpenAI’s API, supporting both direct and proxy modes.
 */
class OpenaiProvider implements Provider {
  private method!: string;
  private endpoint!: string;
  private headers!: Record<string, unknown>;
  private body!: Record<string, unknown>;
  private systemMessage?: string;
  private responseFormat!: 'stream' | 'json';
  private messageParser?: (messages: ChatMessage[]) => OpenaiProviderMessage[];
  private debug = false;

  public constructor(config: OpenaiProviderConfig) {
    this.method = config.method ?? 'POST';
    this.endpoint = config.baseUrl ?? 'https://api.openai.com/v1/chat/completions';
    this.systemMessage = config.systemMessage;
    this.responseFormat = config.responseFormat ?? 'stream';
    this.messageParser = config.messageParser;
    this.debug = config.debug ?? false;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: this.responseFormat === 'stream' ? 'text/event-stream' : 'application/json',
      ...config.headers,
    };
    this.body = {
      model: config.model,
      stream: this.responseFormat === 'stream',
      ...config.body,
    };

    if (config.mode === 'direct') {
      this.headers = { ...this.headers, Authorization: `Bearer ${config.apiKey}` };
      return;
    }

    if (config.mode !== 'proxy') {
      throw new Error("Invalid mode specified for OpenAI provider ('direct' or 'proxy').");
    }
  }

  public async *sendMessages(messages: ChatMessage[]): AsyncGenerator<string> {
    if (this.debug) {
      const sanitizedHeaders = { ...this.headers };
      delete sanitizedHeaders['Authorization'];
      console.log('[OpenaiProvider] Request:', {
        method: this.method,
        endpoint: this.endpoint,
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
      console.log('[OpenaiProvider] Response status:', res.status);
    }

    if (!res.ok) {
      throw new Error(`Openai API error ${res.status}: ${await res.text()}`);
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
        console.log('[OpenaiProvider] Response body:', payload);
      }
      const text = payload.choices?.[0]?.message?.content;
      if (typeof text === 'string') {
        yield text;
      } else {
        throw new Error('Unexpected response shape – no text candidate');
      }
    }
  }

  private toProviderRole(role: ChatMessage['role']): 'system' | 'user' | 'assistant' {
    switch (role) {
      case 'assistant':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return 'user';
    }
  }

  private constructBodyWithMessages(messages: ChatMessage[]) {
    let parsedMessages: OpenaiProviderMessage[];
    if (this.messageParser) {
      parsedMessages = this.messageParser(messages);
    } else {
      parsedMessages = messages
        .filter((message) => typeof message.content === 'string')
        .map((message) => ({
          role: this.toProviderRole(message.role),
          content: message.content,
        }));
    }

    if (this.systemMessage) {
      parsedMessages = [{ role: 'system', content: this.systemMessage }, ...parsedMessages];
    }

    return {
      messages: parsedMessages,
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
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? '';

      for (const line of parts) {
        if (!line.startsWith('data: ')) {
          continue;
        }
        const json = line.slice('data: '.length).trim();
        if (json === '[DONE]') {
          return;
        }
        try {
          const event = JSON.parse(json);
          const chunk = event.choices?.[0]?.delta?.content;
          if (chunk) {
            yield chunk;
          }
        } catch (error) {
          console.error('Stream parse error', error);
        }
      }
    }
  }
}

export default OpenaiProvider;
