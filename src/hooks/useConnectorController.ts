import { useCallback, useEffect, useMemo, useState } from 'react';

import { createLlmClient } from '../client/createLlmClient';
import AnthropicProvider from '../providers/AnthropicProvider';
import GeminiProvider from '../providers/GeminiProvider';
import OpenaiProvider from '../providers/OpenaiProvider';
import WebLlmProvider from '../providers/WebLlmProvider';
import type { Provider } from '../types/Provider';
import type { ChatMessage } from '../types/ChatMessage';
import type { LlmClient } from '../client/types';

const DEFAULT_STORAGE_KEY = 'llm-connector-config';

const PROVIDER_IDS = ['openai', 'anthropic', 'gemini', 'webllm'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderConfigState = Record<string, string>;

export type ConnectorState = {
  selectedProviderId: ProviderId;
  providerConfigs: Record<ProviderId, ProviderConfigState>;
};

export type ConnectorStatus = {
  type: 'idle' | 'success' | 'error';
  message?: string;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type ConnectionContext = {
  providerId: ProviderId;
  provider: Provider;
  rawConfig: ProviderConfigState;
};

export type ConnectResult = {
  client: LlmClient;
  context: ConnectionContext;
};

export type UseConnectorControllerOptions = {
  storageKey?: string;
};

export type ConnectorController = {
  selectedProviderId: ProviderId;
  providerConfigs: Record<ProviderId, ProviderConfigState>;
  status: ConnectorStatus;
  modelOptions: string[];
  isConnecting: boolean;
  isFetchingModels: boolean;
  connectionContext: ConnectionContext | null;
  tokenUsage: TokenUsage;
  selectProvider: (providerId: ProviderId) => void;
  updateConfig: (providerId: ProviderId, key: string, value: string) => void;
  connect: () => Promise<ConnectResult>;
  fetchModels: () => Promise<string[]>;
  setStatus: (status: ConnectorStatus) => void;
  setTokenUsage: (usage: TokenUsage) => void;
  resetConnection: () => void;
};

const DEFAULT_PROVIDER_CONFIGS: Record<ProviderId, ProviderConfigState> = {
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

const loadInitialState = (storageKey: string): ConnectorState => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {
      selectedProviderId: 'openai',
      providerConfigs: { ...DEFAULT_PROVIDER_CONFIGS },
    };
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return {
        selectedProviderId: 'openai',
        providerConfigs: { ...DEFAULT_PROVIDER_CONFIGS },
      };
    }

    const parsed = JSON.parse(stored) as ConnectorState;
    return {
      selectedProviderId: parsed.selectedProviderId ?? 'openai',
      providerConfigs: {
        openai: { ...DEFAULT_PROVIDER_CONFIGS.openai, ...(parsed.providerConfigs?.openai ?? {}) },
        anthropic: { ...DEFAULT_PROVIDER_CONFIGS.anthropic, ...(parsed.providerConfigs?.anthropic ?? {}) },
        gemini: { ...DEFAULT_PROVIDER_CONFIGS.gemini, ...(parsed.providerConfigs?.gemini ?? {}) },
        webllm: { ...DEFAULT_PROVIDER_CONFIGS.webllm, ...(parsed.providerConfigs?.webllm ?? {}) },
      },
    };
  } catch (error) {
    console.warn('[LlmConnector] Failed to load state from localStorage', error);
    return {
      selectedProviderId: 'openai',
      providerConfigs: { ...DEFAULT_PROVIDER_CONFIGS },
    };
  }
};

const persistState = (storageKey: string, state: ConnectorState) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('[LlmConnector] Failed to persist state to localStorage', error);
  }
};

const parseJsonObject = (value: string, label: string): { value: Record<string, unknown>; error?: string } => {
  if (!value?.trim()) {
    return { value: {} };
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { value: parsed as Record<string, unknown> };
    }
    return { value: {}, error: `${label} must be a JSON object.` };
  } catch (error) {
    return { value: {}, error: `${label} JSON parse error: ${(error as Error).message}` };
  }
};

const normalizeHeaders = (input: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(Object.entries(input).map(([key, val]) => [key, String(val)]));

const buildProvider = (providerId: ProviderId, config: ProviderConfigState): Provider => {
  switch (providerId) {
    case 'openai': {
      const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
      const responseFormat = config.responseFormat === 'json' ? 'json' : 'stream';
      const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
      if (headersError) {
        throw new Error(headersError);
      }
      const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
      if (bodyError) {
        throw new Error(bodyError);
      }
      if (!config.model?.trim()) {
        throw new Error('Model is required for OpenAI.');
      }
      const common = {
        model: config.model.trim(),
        systemMessage: config.systemMessage?.trim() || undefined,
        responseFormat,
        headers: normalizeHeaders(headersValue),
        body: bodyValue,
      };
      if (mode === 'direct') {
        if (!config.apiKey?.trim()) {
          throw new Error('API key is required when using direct mode.');
        }
        return new OpenaiProvider({
          mode: 'direct',
          apiKey: config.apiKey.trim(),
          baseUrl: config.baseUrl?.trim() || undefined,
          ...common,
        });
      }
      if (!config.baseUrl?.trim()) {
        throw new Error('Base URL is required when using proxy mode.');
      }
      return new OpenaiProvider({
        mode: 'proxy',
        baseUrl: config.baseUrl.trim(),
        ...common,
      });
    }
    case 'anthropic': {
      const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
      const responseFormat = config.responseFormat === 'json' ? 'json' : 'stream';
      const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
      if (headersError) {
        throw new Error(headersError);
      }
      const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
      if (bodyError) {
        throw new Error(bodyError);
      }
      if (!config.model?.trim()) {
        throw new Error('Model is required for Anthropic.');
      }
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
        if (!config.apiKey?.trim()) {
          throw new Error('API key is required when using direct mode.');
        }
        return new AnthropicProvider({
          mode: 'direct',
          apiKey: config.apiKey.trim(),
          baseUrl: config.baseUrl?.trim() || undefined,
          ...baseConfig,
        });
      }
      if (!config.baseUrl?.trim()) {
        throw new Error('Base URL is required when using proxy mode.');
      }
      return new AnthropicProvider({
        mode: 'proxy',
        baseUrl: config.baseUrl.trim(),
        ...baseConfig,
      });
    }
    case 'gemini': {
      const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
      const responseFormat = config.responseFormat === 'json' ? 'json' : 'stream';
      const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
      if (headersError) {
        throw new Error(headersError);
      }
      const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
      if (bodyError) {
        throw new Error(bodyError);
      }
      if (!config.model?.trim()) {
        throw new Error('Model is required for Gemini.');
      }
      const baseConfig = {
        model: config.model.trim(),
        systemMessage: config.systemMessage?.trim() || undefined,
        responseFormat,
        headers: normalizeHeaders(headersValue),
        body: bodyValue,
      };
      if (mode === 'direct') {
        if (!config.apiKey?.trim()) {
          throw new Error('API key is required when using direct mode.');
        }
        return new GeminiProvider({
          mode: 'direct',
          apiKey: config.apiKey.trim(),
          baseUrl: config.baseUrl?.trim() || undefined,
          ...baseConfig,
        });
      }
      if (!config.baseUrl?.trim()) {
        throw new Error('Base URL is required when using proxy mode.');
      }
      return new GeminiProvider({
        mode: 'proxy',
        baseUrl: config.baseUrl.trim(),
        ...baseConfig,
      });
    }
    case 'webllm': {
      const responseFormat = config.responseFormat === 'json' ? 'json' : 'stream';
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
      if (!config.model?.trim()) {
        throw new Error('Model is required for WebLLM.');
      }
      return new WebLlmProvider({
        model: config.model.trim(),
        systemMessage: config.systemMessage?.trim() || undefined,
        responseFormat,
        engineConfig,
        chatCompletionOptions: completionOptions,
      });
    }
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
};

export const useConnectorController = (
  options: UseConnectorControllerOptions = {}
): ConnectorController => {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const [connectorState, setConnectorState] = useState<ConnectorState>(() => loadInitialState(storageKey));
  const [status, setStatus] = useState<ConnectorStatus>({ type: 'idle' });
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [connectionContext, setConnectionContext] = useState<ConnectionContext | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ inputTokens: 0, outputTokens: 0 });

  useEffect(() => {
    persistState(storageKey, connectorState);
  }, [connectorState, storageKey]);

  const updateConfig = useCallback((providerId: ProviderId, key: string, value: string) => {
    setConnectorState((prev) => ({
      ...prev,
      providerConfigs: {
        ...prev.providerConfigs,
        [providerId]: {
          ...prev.providerConfigs[providerId],
          [key]: value,
        },
      },
    }));
  }, []);

  const selectProvider = useCallback((providerId: ProviderId) => {
    setConnectorState((prev) => ({
      ...prev,
      selectedProviderId: providerId,
    }));
    setModelOptions([]);
    setStatus({ type: 'idle' });
  }, []);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    setIsConnecting(true);
    setStatus({ type: 'idle' });

    try {
      const providerId = connectorState.selectedProviderId;
      const config = connectorState.providerConfigs[providerId];

      if (!config.model?.trim()) {
        throw new Error('Model is required.');
      }

      const provider = buildProvider(providerId, config);
      const client = createLlmClient(provider);
      const context: ConnectionContext = {
        providerId,
        provider,
        rawConfig: { ...config },
      };

      setConnectionContext(context);
      setStatus({ type: 'success', message: 'Connection ready.' });
      return { client, context };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({ type: 'error', message });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [connectorState]);

  const fetchModels = useCallback(async () => {
    setIsFetchingModels(true);
    setStatus({ type: 'idle' });

    try {
      const providerId = connectorState.selectedProviderId;
      const config = connectorState.providerConfigs[providerId];
      let models: string[] = [];

      if (providerId === 'openai') {
        const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
        const headers: Record<string, string> = {};
        const { value: extraHeaders, error } = parseJsonObject(config.headers, 'Headers');
        if (error) {
          throw new Error(error);
        }
        Object.assign(headers, normalizeHeaders(extraHeaders));
        if (mode === 'direct') {
          if (!config.apiKey?.trim()) {
            throw new Error('API key required to fetch OpenAI models.');
          }
          headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
        }
        const baseUrl = config.baseUrl?.trim() || 'https://api.openai.com/v1/chat/completions';
        const apiRoot = baseUrl.replace(/\/chat\/.*/, '');
        const response = await fetch(`${apiRoot}/models`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        const payload = await response.json();
        models = (payload.data ?? []).map((item: { id: string }) => item.id);
      } else if (providerId === 'anthropic') {
        const headers: Record<string, string> = {};
        const { value: extraHeaders, error } = parseJsonObject(config.headers, 'Headers');
        if (error) {
          throw new Error(error);
        }
        Object.assign(headers, normalizeHeaders(extraHeaders));
        const mode = config.mode === 'proxy' ? 'proxy' : 'direct';
        if (mode === 'direct') {
          if (!config.apiKey?.trim()) {
            throw new Error('API key required to fetch Claude models.');
          }
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
        models = (payload.data ?? []).map((item: { id?: string; name?: string }) => item.id ?? item.name).filter(Boolean) as string[];
      } else if (providerId === 'gemini') {
        const headers: Record<string, string> = {};
        const { value: extraHeaders, error } = parseJsonObject(config.headers, 'Headers');
        if (error) {
          throw new Error(error);
        }
        Object.assign(headers, normalizeHeaders(extraHeaders));
        const baseUrl = config.baseUrl?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
        let url = `${baseUrl}/models`;
        if ((config.mode ?? 'direct') !== 'proxy') {
          if (!config.apiKey?.trim()) {
            throw new Error('API key required to fetch Gemini models.');
          }
          url += `?key=${encodeURIComponent(config.apiKey.trim())}`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        const payload = await response.json();
        models = (payload.models ?? []).map((item: { name: string }) => item.name?.split('/').pop()).filter(Boolean) as string[];
      } else {
        models = [];
      }

      if (!models.length) {
        setStatus({ type: 'error', message: 'No models returned by the provider.' });
      } else {
        setStatus({ type: 'success', message: `Fetched ${models.length} models.` });
        setModelOptions(models);
        const selectedConfig = connectorState.providerConfigs[connectorState.selectedProviderId];
        if (!models.includes(selectedConfig.model)) {
          updateConfig(connectorState.selectedProviderId, 'model', models[0]!);
        }
      }

      return models;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({ type: 'error', message });
      throw error;
    } finally {
      setIsFetchingModels(false);
    }
  }, [connectorState, updateConfig]);

  const resetConnection = useCallback(() => {
    setConnectionContext(null);
    setTokenUsage({ inputTokens: 0, outputTokens: 0 });
    setStatus({ type: 'idle' });
  }, []);

  return useMemo<ConnectorController>(
    () => ({
      selectedProviderId: connectorState.selectedProviderId,
      providerConfigs: connectorState.providerConfigs,
      status,
      modelOptions,
      isConnecting,
      isFetchingModels,
      connectionContext,
      tokenUsage,
      selectProvider,
      updateConfig,
      connect,
      fetchModels,
      setStatus,
      setTokenUsage,
      resetConnection,
    }),
    [
      connectorState,
      status,
      modelOptions,
      isConnecting,
      isFetchingModels,
      connectionContext,
      tokenUsage,
      selectProvider,
      updateConfig,
      connect,
      fetchModels,
      setStatus,
      setTokenUsage,
      resetConnection,
    ]
  );
};
