/**
 * 高级配置相关的类型定义
 * 
 * 从 useConnectorController 中提取的复杂类型定义
 * 用于未来的 useAdvancedSettings 功能
 */

import type { ProviderId, ProviderConfigState } from '../constants/DefaultConfigs';
import type { LlmClient } from '../client/types';
import type { Provider } from './Provider';

/**
 * 连接器状态
 */
export type ConnectorState = {
  selectedProviderId: ProviderId;
  providerConfigs: Record<ProviderId, ProviderConfigState>;
};

/**
 * 连接状态
 */
export type ConnectorStatus = {
  type: 'idle' | 'success' | 'error';
  message?: string;
};

/**
 * Token 使用统计
 */
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

/**
 * 连接上下文
 */
export type ConnectionContext = {
  providerId: ProviderId;
  provider: Provider;
  rawConfig: ProviderConfigState;
};

/**
 * 连接结果
 */
export type ConnectResult = {
  client: LlmClient;
  context: ConnectionContext;
};

/**
 * 存储选项
 */
export type StorageOptions = {
  storageKey?: string;
};

/**
 * 高级配置控制器接口
 * 为未来的 useAdvancedSettings 预留的完整接口定义
 */
export type AdvancedConnectorController = {
  // 状态
  selectedProviderId: ProviderId;
  providerConfigs: Record<ProviderId, ProviderConfigState>;
  status: ConnectorStatus;
  modelOptions: string[];
  isConnecting: boolean;
  isFetchingModels: boolean;
  connectionContext: ConnectionContext | null;
  tokenUsage: TokenUsage;
  
  // 操作方法
  selectProvider: (providerId: ProviderId) => void;
  updateConfig: (providerId: ProviderId, key: string, value: string) => void;
  connect: () => Promise<ConnectResult>;
  fetchModels: () => Promise<string[]>;
  setStatus: (status: ConnectorStatus) => void;
  setTokenUsage: (usage: TokenUsage) => void;
  resetConnection: () => void;
};

/**
 * Provider 模式
 */
export type ProviderMode = 'direct' | 'proxy';

/**
 * 响应格式
 */
export type ResponseFormat = 'stream' | 'json';

/**
 * Provider 特定配置
 */
export type OpenAIConfig = {
  mode: ProviderMode;
  apiKey: string;
  baseUrl?: string;
  model: string;
  responseFormat: ResponseFormat;
  systemMessage?: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export type AnthropicConfig = {
  mode: ProviderMode;
  apiKey: string;
  baseUrl?: string;
  model: string;
  responseFormat: ResponseFormat;
  systemMessage?: string;
  maxOutputTokens: number;
  anthropicVersion?: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export type GeminiConfig = {
  mode: ProviderMode;
  apiKey: string;
  baseUrl?: string;
  model: string;
  responseFormat: ResponseFormat;
  systemMessage?: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export type WebLLMConfig = {
  model: string;
  responseFormat: ResponseFormat;
  systemMessage?: string;
  engineConfig: Record<string, unknown>;
  chatCompletionOptions: Record<string, unknown>;
};