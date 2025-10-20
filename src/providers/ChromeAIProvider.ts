import { LlmClient } from '../client/LlmClient';

// Chrome AI 类型定义
interface ChromeAICapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface ChromeAISession {
  prompt: (text: string) => Promise<string>;
  promptStreaming: (text: string) => AsyncIterable<string>;
  destroy: () => void;
  clone: () => Promise<ChromeAISession>;
}

declare global {
  interface Window {
    ai?: {
      assistant: {
        capabilities: () => Promise<ChromeAICapabilities>;
        create: (options?: {
          temperature?: number;
          topK?: number;
          systemPrompt?: string;
        }) => Promise<ChromeAISession>;
      };
    };
  }
}

/**
 * Chrome AI Provider
 * 使用浏览器内置的 window.ai API
 * 
 * @see https://developer.chrome.com/docs/ai/built-in-apis
 */
export const createChromeAIProvider = async (
  temperature?: number,
  topK?: number,
  systemPrompt?: string
): Promise<LlmClient> => {
  // 1. 检查 Chrome AI 可用性
  if (!window.ai?.assistant) {
    throw new Error('Chrome AI is not available. Please use Chrome 127+ with AI features enabled.');
  }
  
  // 2. 检查能力
  const capabilities = await window.ai.assistant.capabilities();
  
  if (capabilities.available === 'no') {
    throw new Error('Chrome AI is not supported on this device.');
  }
  
  if (capabilities.available === 'after-download') {
    throw new Error('Chrome AI is downloading. Please wait and try again.');
  }
  
  // 3. 创建会话
  const session = await window.ai.assistant.create({
    temperature: temperature ?? capabilities.defaultTemperature ?? 0.7,
    topK: topK ?? capabilities.defaultTopK ?? 3,
    systemPrompt: systemPrompt,
  });
  
  // 4. 创建兼容 TokenJS 接口的包装器
  const chromeAIWrapper = {
    chat: {
      completions: {
        create: async (params: any) => {
          const messages = params.messages || [];
          const stream = params.stream || false;
          
          // Chrome AI 只支持简单的 prompt
          // 将多轮对话转换为单个 prompt
          const prompt = messages
            .map((msg: any) => `${msg.role}: ${msg.content}`)
            .join('\n\n');
          
          if (stream) {
            // 流式响应
            const streamIterator = session.promptStreaming(prompt);
            let fullText = '';
            
            return {
              [Symbol.asyncIterator]: async function* () {
                for await (const chunk of streamIterator) {
                  fullText = chunk;
                  yield {
                    choices: [{
                      delta: { content: chunk },
                      index: 0,
                    }],
                  };
                }
              },
            };
          } else {
            // 非流式响应
            const response = await session.prompt(prompt);
            
            return {
              choices: [{
                message: {
                  content: response,
                  role: 'assistant',
                },
                finish_reason: 'stop',
                index: 0,
              }],
              usage: {
                prompt_tokens: 0,  // Chrome AI 不提供 token 统计
                completion_tokens: 0,
                total_tokens: 0,
              },
              model: 'chrome-ai',
              object: 'chat.completion',
            };
          }
        },
      },
    },
  };
  
  return new LlmClient(chromeAIWrapper, 'chrome-ai', 'chrome-ai-builtin');
};

/**
 * 检查 Chrome AI 是否可用
 */
export const checkChromeAIAvailability = async (): Promise<{
  available: boolean;
  status: string;
}> => {
  if (!window.ai?.assistant) {
    return { available: false, status: 'not-supported' };
  }
  
  try {
    const capabilities = await window.ai.assistant.capabilities();
    return {
      available: capabilities.available === 'readily',
      status: capabilities.available,
    };
  } catch (error) {
    return { available: false, status: 'error' };
  }
};
