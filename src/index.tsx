// --- Main Provider & Context Hook --- //
import { LlmConnectorProvider, useLlmConnector } from './providers/LlmConnectorProvider';

// --- UI Components --- //
import { ConnectionFormEn } from './components/ConnectionForm/index.en';
import { ConnectionFormZh } from './components/ConnectionForm/index.zh';
import { ModelSelectEn } from './components/ModelSelect/index.en';
import { ModelSelectZh } from './components/ModelSelect/index.zh';
import { TokenUsageEn } from './components/TokenUsage/index.en';
import { TokenUsageZh } from './components/TokenUsage/index.zh';

// --- Logic Hook for Advanced Usage --- //
import { useLlmConnectorLogic } from './hooks/useLlmConnectorLogic';

// --- Client & Types --- //
import { LlmClient } from './client/LlmClient';
import type { ChatMessage } from './types/ChatMessage';
import type { ChatRequest, ChatResult, StreamingChatResult, StreamChunk } from './types';

// --- Export all public-facing parts --- //
export {
  // Provider & Hooks
  LlmConnectorProvider,
  useLlmConnector,
  useLlmConnectorLogic,

  // UI Components
  ConnectionFormEn,
  ConnectionFormZh,
  ModelSelectEn,
  ModelSelectZh,
  TokenUsageEn,
  TokenUsageZh,

  // Client
  LlmClient,
};

// --- Export all public types --- //
export type {
  ChatMessage,
  ChatRequest,
  ChatResult,
  StreamingChatResult,
  StreamChunk,
};