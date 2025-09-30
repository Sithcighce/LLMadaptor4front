/**
 * 模型获取工具函数
 * 
 * 提供从各个 LLM Provider 获取可用模型列表的功能
 * 从 useConnectorController 中提取的完整实现
 */

import { parseJsonObject, normalizeHeaders, validateRequired } from './configValidation';
import type { ProviderId, ProviderConfigState } from '../constants/DefaultConfigs';

/**
 * 从 OpenAI 获取模型列表
 * @param config - OpenAI 配置
 * @returns 模型列表
 */
export const fetchOpenAIModels = async (config: ProviderConfigState): Promise<string[]> => {
  const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
  const headers: Record<string, string> = {};
  
  const { value: extraHeaders, error } = parseJsonObject(config.headers, 'Headers');
  if (error) {
    throw new Error(error);
  }
  Object.assign(headers, normalizeHeaders(extraHeaders));

  if (mode === 'direct') {
    validateRequired(config.apiKey, 'API key');
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const baseUrl = config.baseUrl?.trim() || 'https://api.openai.com/v1/chat/completions';
  const apiRoot = baseUrl.replace(/\/chat\/.*/, '');
  
  const response = await fetch(`${apiRoot}/models`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models (${response.status})`);
  }

  const payload = await response.json();
  return (payload.data ?? []).map((item: { id: string }) => item.id);
};

/**
 * 从 Anthropic 获取模型列表
 * @param config - Anthropic 配置
 * @returns 模型列表
 */
export const fetchAnthropicModels = async (config: ProviderConfigState): Promise<string[]> => {
  const headers: Record<string, string> = {};
  const { value: extraHeaders, error } = parseJsonObject(config.headers, 'Headers');
  if (error) {
    throw new Error(error);
  }
  Object.assign(headers, normalizeHeaders(extraHeaders));

  const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
  if (mode === 'direct') {
    validateRequired(config.apiKey, 'API key');
    headers['x-api-key'] = config.apiKey.trim();
    headers['anthropic-version'] = config.anthropicVersion?.trim() || '2023-06-01';
  }

  const baseUrl = config.baseUrl?.trim() || 'https://api.anthropic.com/v1/messages';
  const apiRoot = baseUrl.replace(/\/messages?$/, '');
  
  const response = await fetch(`${apiRoot}/models`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models (${response.status})`);
  }

  const payload = await response.json();
  return (payload.data ?? [])
    .map((item: { id?: string; name?: string }) => item.id ?? item.name)
    .filter(Boolean) as string[];
};

/**
 * 从 Gemini 获取模型列表
 * @param config - Gemini 配置
 * @returns 模型列表
 */
export const fetchGeminiModels = async (config: ProviderConfigState): Promise<string[]> => {
  const headers: Record<string, string> = {};
  const { value: extraHeaders, error } = parseJsonObject(config.headers, 'Headers');
  if (error) {
    throw new Error(error);
  }
  Object.assign(headers, normalizeHeaders(extraHeaders));

  const baseUrl = config.baseUrl?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
  let url = `${baseUrl}/models`;
  
  if ((config.mode ?? 'direct') !== 'proxy') {
    validateRequired(config.apiKey, 'API key');
    url += `?key=${encodeURIComponent(config.apiKey.trim())}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models (${response.status})`);
  }

  const payload = await response.json();
  return (payload.models ?? [])
    .map((item: { name: string }) => item.name?.split('/').pop())
    .filter(Boolean) as string[];
};

/**
 * 根据 Provider ID 获取模型列表
 * @param providerId - Provider ID
 * @param config - Provider 配置
 * @returns 模型列表
 */
export const fetchModelsForProvider = async (
  providerId: ProviderId, 
  config: ProviderConfigState
): Promise<string[]> => {
  switch (providerId) {
    case 'openai':
      return fetchOpenAIModels(config);
    case 'anthropic':
      return fetchAnthropicModels(config);
    case 'gemini':
      return fetchGeminiModels(config);
    case 'webllm':
      // WebLLM 不支持动态获取模型，返回空数组
      return [];
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
};