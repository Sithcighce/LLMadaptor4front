/**
 * 统一类型导出
 * 
 * 集中导出所有类型定义，解决导入问题
 */

// 基础类型
export type { ProviderId, ProviderConfigState } from '../constants/DefaultConfigs';
export type { Provider } from './Provider';
export type { ChatMessage } from './ChatMessage';
export type { ChatRequest } from './ChatRequest';
export type { PluginConfig } from './PluginConfig';

// 高级配置类型
export type { 
  ConnectorState,
  TokenUsage,
  ConnectionContext,
  ConnectResult,
  StorageOptions,
  AdvancedConnectorController,
  ProviderMode,
  ResponseFormat,
  OpenAIConfig,
  AnthropicConfig,
  GeminiConfig,
  WebLLMConfig
} from './AdvancedConfig';

// Provider 配置类型
export type { AnthropicProviderConfig } from './provider-config/AnthropicProviderConfig';
export type { GeminiProviderConfig } from './provider-config/GeminiProviderConfig';
export type { OpenaiProviderConfig } from './provider-config/OpenaiProviderConfig';
export type { WebLlmProviderConfig } from './provider-config/WebLlmProviderConfig';

// Provider 消息类型
export type { AnthropicProviderMessage } from './provider-message/AnthropicProviderMessage';
export type { GeminiProviderMessage } from './provider-message/GeminiProviderMessage';
export type { OpenaiProviderMessage } from './provider-message/OpenaiProviderMessage';
export type { WebLlmProviderMessage } from './provider-message/WebLlmProviderMessage';

// 修正的连接状态类型 - 简化为字符串枚举
export type ConnectorStatus = 'disconnected' | 'connecting' | 'connected' | 'error';