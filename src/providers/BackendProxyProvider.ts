import { LlmClient } from '../client/LlmClient';

/**
 * Backend Proxy Provider
 * 通过后端代理调用 AI API，API Key 存储在后端
 * 
 * 适用场景：
 * - 不想在前端暴露 API Key
 * - 需要统一管理和计费
 * - 需要添加额外的安全控制
 */
export const createBackendProxyProvider = (
  backendUrl: string = '/api/ai/proxy',
  model?: string
): LlmClient => {
  if (!backendUrl) {
    throw new Error('Backend proxy URL is required');
  }

  // 创建兼容 TokenJS 接口的包装器
  const backendProxyWrapper = {
    chat: {
      completions: {
        create: async (params: any) => {
          const messages = params.messages || [];
          const stream = params.stream || false;
          const selectedModel = params.model || model || 'default';

          const requestBody = {
            model: selectedModel,
            messages: messages,
            stream: stream,
            ...params,
          };

          if (stream) {
            // 流式响应
            const response = await fetch(backendUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
              throw new Error(`Backend proxy error: ${response.status} ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            return {
              [Symbol.asyncIterator]: async function* () {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                          const parsed = JSON.parse(data);
                          yield {
                            choices: [{
                              delta: { content: parsed.choices?.[0]?.delta?.content || '' },
                              index: 0,
                            }],
                          };
                        } catch (e) {
                          console.warn('Failed to parse SSE data:', data);
                        }
                      }
                    }
                  }
                } finally {
                  reader.releaseLock();
                }
              },
            };
          } else {
            // 非流式响应
            const response = await fetch(backendUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Backend proxy error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            return {
              choices: [{
                message: {
                  content: data.choices?.[0]?.message?.content || '',
                  role: 'assistant',
                },
                finish_reason: data.choices?.[0]?.finish_reason || 'stop',
                index: 0,
              }],
              usage: {
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0,
                total_tokens: data.usage?.total_tokens || 0,
              },
              model: data.model || selectedModel,
              object: 'chat.completion',
            };
          }
        },
      },
    },
  };

  return new LlmClient(backendProxyWrapper, 'backend-proxy', model || 'backend-managed');
};

/**
 * 检查后端代理服务器状态
 */
export const checkBackendProxyStatus = async (
  backendUrl: string = '/api/ai/proxy'
): Promise<{
  online: boolean;
  error?: string;
}> => {
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return {
      online: response.ok,
      error: response.ok ? undefined : `Server returned ${response.status}`,
    };
  } catch (error: any) {
    return {
      online: false,
      error: error.message,
    };
  }
};
