/**
 * Provider 工厂函数
 * 
 * 从 useConnectorController 中提取的 Provider 构建逻辑
 * 用于未来的高级配置功能
 */

import AnthropicProvider from '../providers/AnthropicProvider';
import GeminiProvider from '../providers/GeminiProvider';
import OpenaiProvider from '../providers/OpenaiProvider';
import WebLlmProvider from '../providers/WebLlmProvider';
import type { Provider } from '../types/Provider';
import { parseJsonObject, normalizeHeaders, validateRequired } from './configValidation';
import type { ProviderId, ProviderConfigState } from '../constants/DefaultConfigs';

/**
 * 构建 OpenAI Provider
 * @param config - OpenAI 配置
 * @returns OpenAI Provider 实例
 */
export const buildOpenAIProvider = (config: ProviderConfigState): Provider => {
  const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
  const responseFormat = config.responseFormat === 'json' ? 'json' as const : 'stream' as const;
  
  const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
  if (headersError) {
    throw new Error(headersError);
  }
  
  const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
  if (bodyError) {
    throw new Error(bodyError);
  }
  
  validateRequired(config.model, 'Model');
  
  const common = {
    model: config.model.trim(),
    systemMessage: config.systemMessage?.trim() || undefined,
    responseFormat,
    headers: normalizeHeaders(headersValue),
    body: bodyValue,
  };

  if (mode === 'direct') {
    validateRequired(config.apiKey, 'API key');
    return new OpenaiProvider({
      mode: 'direct',
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl?.trim() || undefined,
      ...common,
    });
  }

  validateRequired(config.baseUrl, 'Base URL');
  return new OpenaiProvider({
    mode: 'proxy',
    baseUrl: config.baseUrl.trim(),
    ...common,
  });
};

/**
 * 构建 Anthropic Provider
 * @param config - Anthropic 配置
 * @returns Anthropic Provider 实例
 */
export const buildAnthropicProvider = (config: ProviderConfigState): Provider => {
  const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
  const responseFormat = config.responseFormat === 'json' ? 'json' as const : 'stream' as const;
  
  const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
  if (headersError) {
    throw new Error(headersError);
  }
  
  const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
  if (bodyError) {
    throw new Error(bodyError);
  }
  
  validateRequired(config.model, 'Model');
  
  const maxOutputTokens = Number.parseInt(config.maxOutputTokens || '0', 10) || 1024;
  const baseConfig = {
    model: config.model.trim(),
    systemMessage: config.systemMessage?.trim() || undefined,
    responseFormat,
    maxOutputTokens,
    anthropicVersion: config.anthropicVersion?.trim() || undefined,
    headers: normalizeHeaders(headersValue),
    body: bodyValue,
  };

  if (mode === 'direct') {
    validateRequired(config.apiKey, 'API key');
    return new AnthropicProvider({
      mode: 'direct',
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl?.trim() || undefined,
      ...baseConfig,
    });
  }

  validateRequired(config.baseUrl, 'Base URL');
  return new AnthropicProvider({
    mode: 'proxy',
    baseUrl: config.baseUrl.trim(),
    ...baseConfig,
  });
};

/**
 * 构建 Gemini Provider
 * @param config - Gemini 配置
 * @returns Gemini Provider 实例
 */
export const buildGeminiProvider = (config: ProviderConfigState): Provider => {
  const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
  const responseFormat = config.responseFormat === 'json' ? 'json' as const : 'stream' as const;
  
  const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
  if (headersError) {
    throw new Error(headersError);
  }
  
  const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
  if (bodyError) {
    throw new Error(bodyError);
  }
  
  validateRequired(config.model, 'Model');
  
  const baseConfig = {
    model: config.model.trim(),
    systemMessage: config.systemMessage?.trim() || undefined,
    responseFormat,
    headers: normalizeHeaders(headersValue),
    body: bodyValue,
  };

  if (mode === 'direct') {
    validateRequired(config.apiKey, 'API key');
    return new GeminiProvider({
      mode: 'direct',
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl?.trim() || undefined,
      ...baseConfig,
    });
  }

  validateRequired(config.baseUrl, 'Base URL');
  return new GeminiProvider({
    mode: 'proxy',
    baseUrl: config.baseUrl.trim(),
    ...baseConfig,
  });
};

/**
 * 构建 WebLLM Provider
 * @param config - WebLLM 配置
 * @returns WebLLM Provider 实例
 */
export const buildWebLLMProvider = (config: ProviderConfigState): Provider => {
  const responseFormat = config.responseFormat === 'json' ? 'json' as const : 'stream' as const;
  
  const { value: engineConfig, error: engineError } = parseJsonObject(config.engineConfig, 'Engine config');
  if (engineError) {
    throw new Error(engineError);
  }
  
  const { value: completionOptions, error: completionError } = parseJsonObject(
    config.chatCompletionOptions,
    'Chat completion options'
  );
  if (completionError) {
    throw new Error(completionError);
  }
  
  validateRequired(config.model, 'Model');
  
  return new WebLlmProvider({
    model: config.model.trim(),
    systemMessage: config.systemMessage?.trim() || undefined,
    responseFormat,
    engineConfig,
    chatCompletionOptions: completionOptions,
  });
};

/**
 * 根据 Provider ID 和配置构建 Provider 实例
 * @param providerId - Provider ID
 * @param config - Provider 配置
 * @returns Provider 实例
 */
export const buildProvider = (providerId: ProviderId, config: ProviderConfigState): Provider => {
  switch (providerId) {
    case 'openai':
      return buildOpenAIProvider(config);
    case 'anthropic':
      return buildAnthropicProvider(config);
    case 'gemini':
      return buildGeminiProvider(config);
    case 'webllm':
      return buildWebLLMProvider(config);
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
};