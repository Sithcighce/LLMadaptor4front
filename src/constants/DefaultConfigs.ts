/**
 * 默认 Provider 配置模板
 * 
 * 包含所有支持的 LLM Provider 的默认配置
 * 从 useConnectorController 中提取，用于未来的 useAdvancedSettings
 */

export const PROVIDER_IDS = ['openai', 'anthropic', 'gemini', 'webllm'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderConfigState = Record<string, string>;

/**
 * 默认 Provider 配置
 * 包含所有必要的配置字段和默认值
 */
export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderId, ProviderConfigState> = {
  openai: {
    mode: 'direct',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4.1-mini',
    responseFormat: 'stream',
    systemMessage: '',
    headers: '',
    body: '',
  },
  anthropic: {
    mode: 'direct',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    responseFormat: 'stream',
    systemMessage: '',
    maxOutputTokens: '1024',
    headers: '',
    body: '',
    anthropicVersion: '2023-06-01',
  },
  gemini: {
    mode: 'direct',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash',
    responseFormat: 'stream',
    systemMessage: '',
    headers: '',
    body: '',
  },
  webllm: {
    model: 'Qwen2-0.5B-Instruct-q4f16_1-MLC',
    responseFormat: 'stream',
    systemMessage: '',
    engineConfig: '',
    chatCompletionOptions: '',
  },
};

/**
 * 获取指定 Provider 的默认配置
 * @param providerId - Provider ID
 * @returns 该 Provider 的默认配置
 */
export const getDefaultConfig = (providerId: ProviderId): ProviderConfigState => {
  return { ...DEFAULT_PROVIDER_CONFIGS[providerId] };
};

/**
 * 获取所有 Provider 的默认配置
 * @returns 所有 Provider 的默认配置
 */
export const getAllDefaultConfigs = (): Record<ProviderId, ProviderConfigState> => {
  const configs: Record<ProviderId, ProviderConfigState> = {} as Record<ProviderId, ProviderConfigState>;
  
  for (const providerId of PROVIDER_IDS) {
    configs[providerId] = getDefaultConfig(providerId);
  }
  
  return configs;
};