import TokenJS from 'token.js';
import { LlmClient } from '../client/LlmClient';

/**
 * Silicon Flow Provider
 * 硅基流动 - 中国的 LLM API 服务
 * 
 * @see https://siliconflow.cn/
 */
export const createSiliconFlowProvider = (
  apiKey: string,
  baseUrl: string = 'https://api.siliconflow.cn/v1',
  model: string = 'Qwen/Qwen2.5-7B-Instruct'
): LlmClient => {
  if (!apiKey) {
    throw new Error('API Key is required for Silicon Flow');
  }

  // Silicon Flow 使用 OpenAI 兼容格式
  const tokenJs = new TokenJS({
    provider: 'openai',
    apiKey: apiKey,
    baseURL: baseUrl,
  });

  return new LlmClient(tokenJs, 'siliconflow', model);
};

/**
 * 获取 Silicon Flow 可用模型列表
 */
export const fetchSiliconFlowModels = async (
  apiKey: string,
  baseUrl: string = 'https://api.siliconflow.cn/v1'
): Promise<string[]> => {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data = await response.json();
    return (data.data || []).map((m: any) => m.id);
    
  } catch (error: any) {
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
};

/**
 * 常用的 Silicon Flow 模型列表
 */
export const SILICONFLOW_MODELS = [
  'Qwen/Qwen2.5-7B-Instruct',
  'Qwen/Qwen2.5-14B-Instruct',
  'Qwen/Qwen2.5-32B-Instruct',
  'Qwen/Qwen2.5-72B-Instruct',
  'deepseek-ai/DeepSeek-V2.5',
  'THUDM/glm-4-9b-chat',
  'Pro/THUDM/glm-4-plus',
];
