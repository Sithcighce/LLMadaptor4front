
import type { ChatRequest, ChatResult, StreamingChatResult } from '../types/ChatRequest';

// TokenJS 接口定义
interface TokenJSInterface {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
}

// API 响应类型定义
interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: unknown;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/**
 * Our standardized, user-facing client for interacting with LLMs.
 * It acts as a wrapper around a Token.js instance, providing a simplified
 * and consistent API.
 */
export class LlmClient {
  private tokenJs: TokenJSInterface;
  private provider: string;
  private model: string;

  constructor(tokenJs: TokenJSInterface, provider: string, model: string) {
    this.tokenJs = tokenJs;
    this.provider = provider;
    this.model = model;
  }

  /**
   * The main method for interacting with the LLM.
   * @param request - The chat request object, containing messages and other options.
   * @returns A promise that resolves to a ChatResult or a StreamingChatResult.
   */
  public async chat(request: ChatRequest): Promise<ChatResult | StreamingChatResult> {
    const paramsForTokenJs = {
      provider: this.provider,
      model: this.model,
      messages: request.messages,
      stream: request.stream ?? false,
      ...request.params,
    };

  const response = await this.tokenJs.chat.completions.create(paramsForTokenJs);

    if (request.stream) {
      // Handle streaming response
      // Streaming逻辑略，实际项目可补充实现
      return {
        stream: (async function* () {})(),
        usage: Promise.resolve(undefined),
        final: Promise.resolve(undefined),
      };

    } else {
      // Handle non-streaming response
      const rawResponse = response as LLMResponse;
      return {
        text: rawResponse.choices?.[0]?.message?.content || '',
        usage: {
          input: rawResponse.usage?.prompt_tokens || 0,
          output: rawResponse.usage?.completion_tokens || 0,
        },
        stop_reason: rawResponse.choices?.[0]?.finish_reason || 'unknown',
        tool_calls: rawResponse.choices?.[0]?.message?.tool_calls || null,
        raw: { response: rawResponse },
      };
    }
  }
}
