import TokenJS from 'token.js';
import { LlmClient } from '../client/LlmClient';

/**
 * LM Studio Provider
 * 连接本地运行的 LM Studio 服务器
 * 
 * @see https://lmstudio.ai/docs/api
 */
export const createLMStudioProvider = async (
  baseUrl: string = 'http://localhost:1234/v1',
  model?: string
): Promise<LlmClient> => {
  // 1. 测试服务器连接
  try {
    const modelsResponse = await fetch(`${baseUrl.replace('/v1', '')}/v1/models`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),  // 5秒超时
    });
    
    if (!modelsResponse.ok) {
      throw new Error(`LM Studio server returned ${modelsResponse.status}`);
    }
    
    const modelsData = await modelsResponse.json();
    const models = modelsData.data || [];
    
    if (models.length === 0) {
      throw new Error('No models loaded in LM Studio. Please load a model first.');
    }
    
    // 2. 选择模型
    const selectedModel = model || models[0].id;
    
    // 验证模型是否存在
    const modelExists = models.some((m: any) => m.id === selectedModel);
    if (!modelExists && model) {
      console.warn(`Model "${model}" not found. Using "${models[0].id}" instead.`);
    }
    
    // 3. 创建 TokenJS 实例
    // LM Studio 兼容 OpenAI API
    const tokenJs = new TokenJS({
      provider: 'openai',
      apiKey: 'lm-studio',  // LM Studio 不需要真实 API Key
      baseURL: baseUrl,
    });
    
    return new LlmClient(
      tokenJs,
      'lmstudio',
      modelExists && model ? model : models[0].id
    );
    
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('LM Studio connection timeout. Is the server running?');
    }
    throw new Error(`Failed to connect to LM Studio: ${error.message}`);
  }
};

/**
 * 获取 LM Studio 可用模型列表
 */
export const fetchLMStudioModels = async (
  baseUrl: string = 'http://localhost:1234/v1'
): Promise<string[]> => {
  try {
    const response = await fetch(`${baseUrl.replace('/v1', '')}/v1/models`, {
      signal: AbortSignal.timeout(5000),
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
 * 检查 LM Studio 服务器状态
 */
export const checkLMStudioStatus = async (
  baseUrl: string = 'http://localhost:1234/v1'
): Promise<{
  online: boolean;
  modelsCount: number;
}> => {
  try {
    const models = await fetchLMStudioModels(baseUrl);
    return {
      online: true,
      modelsCount: models.length,
    };
  } catch (error) {
    return {
      online: false,
      modelsCount: 0,
    };
  }
};
