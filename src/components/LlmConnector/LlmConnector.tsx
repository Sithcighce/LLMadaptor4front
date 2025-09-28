import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import './LlmConnector.css';
import type { MLCEngineConfig } from '@mlc-ai/web-llm';

import { createLlmClient, type LlmClient } from '../../client';
import type { Provider } from '../../types/Provider';
import OpenaiProvider from '../../providers/OpenaiProvider';
import AnthropicProvider from '../../providers/AnthropicProvider';
import GeminiProvider from '../../providers/GeminiProvider';
import WebLlmProvider from '../../providers/WebLlmProvider';

const DEFAULT_STORAGE_KEY = 'llm-connector-config';

const PROVIDER_OPTIONS = [
  { id: 'openai', label: 'OpenAI / Compatible', description: 'Official OpenAI API, Azure OpenAI, and OpenAI-compatible gateways.' },
  { id: 'anthropic', label: 'Anthropic Claude', description: 'Claude models via Anthropic API key or compatible proxy.' },
  { id: 'gemini', label: 'Google Gemini', description: 'Gemini models via Google AI Studio key or custom proxy.' },
  { id: 'webllm', label: 'WebLLM (browser runtime)', description: 'Runs open models directly in the browser via @mlc-ai/web-llm.' },
] as const;

type ProviderId = (typeof PROVIDER_OPTIONS)[number]['id'];

type ProviderConfigState = Record<string, string>;

type ConnectorState = {
  selectedProviderId: ProviderId;
  providerConfigs: Record<ProviderId, ProviderConfigState>;
};

type ProviderContext = {
  providerId: ProviderId;
  provider: Provider;
  rawConfig: ProviderConfigState;
};

type LlmConnectorProps = {
  onReady: (client: LlmClient, context: ProviderContext) => void;
  storageKey?: string;
};

type ParseResult = {
  value: Record<string, unknown>;
  error?: string;
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

const createDefaultState = (): ConnectorState => ({
  selectedProviderId: 'openai',
  providerConfigs: { ...DEFAULT_PROVIDER_CONFIGS },
});

const loadState = (storageKey: string): ConnectorState => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return createDefaultState();
  }
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return createDefaultState();
    }
    const parsed = JSON.parse(rawValue) as ConnectorState;
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
    return createDefaultState();
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

const parseJsonObject = (value: string, label: string): ParseResult => {
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

const LlmConnector = ({ onReady, storageKey = DEFAULT_STORAGE_KEY }: LlmConnectorProps) => {
  const [state, setState] = useState<ConnectorState>(() => loadState(storageKey));
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const selectedConfig = state.providerConfigs[state.selectedProviderId];

  useEffect(() => {
    persistState(storageKey, state);
  }, [state, storageKey]);

  useEffect(() => {
    setModelOptions([]);
  }, [state.selectedProviderId]);

  const updateProviderConfig = useCallback(
    (providerId: ProviderId, key: string, value: string) => {
      setState((prev) => ({
        ...prev,
        providerConfigs: {
          ...prev.providerConfigs,
          [providerId]: {
            ...prev.providerConfigs[providerId],
            [key]: value,
          },
        },
      }));
    },
    []
  );

  const handleProviderChange = useCallback((providerId: ProviderId) => {
    setState((prev) => ({
      ...prev,
      selectedProviderId: providerId,
    }));
    setStatus({ type: 'idle' });
  }, []);

  const buildOpenaiProvider = useCallback((config: ProviderConfigState): Provider => {
    if (!config.model?.trim()) {
      throw new Error('Model is required for OpenAI-compatible providers.');
    }
    const mode = (config.mode ?? 'direct').toLowerCase();
    const responseFormat = (config.responseFormat === 'json' ? 'json' : 'stream') as 'stream' | 'json';
    const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
    if (headersError) {
      throw new Error(headersError);
    }
    const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
    if (bodyError) {
      throw new Error(bodyError);
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
  }, []);

  const buildAnthropicProvider = useCallback((config: ProviderConfigState): Provider => {
    if (!config.model?.trim()) {
      throw new Error('Model is required for Anthropic.');
    }
    const mode = (config.mode ?? 'direct').toLowerCase();
    const responseFormat = (config.responseFormat === 'json' ? 'json' : 'stream') as 'stream' | 'json';
    const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
    if (headersError) {
      throw new Error(headersError);
    }
    const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
    if (bodyError) {
      throw new Error(bodyError);
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
  }, []);

  const buildGeminiProvider = useCallback((config: ProviderConfigState): Provider => {
    if (!config.model?.trim()) {
      throw new Error('Model is required for Gemini.');
    }
    const mode = (config.mode ?? 'direct').toLowerCase();
    const responseFormat = (config.responseFormat === 'json' ? 'json' : 'stream') as 'stream' | 'json';
    const { value: headersValue, error: headersError } = parseJsonObject(config.headers, 'Headers');
    if (headersError) {
      throw new Error(headersError);
    }
    const { value: bodyValue, error: bodyError } = parseJsonObject(config.body, 'Body');
    if (bodyError) {
      throw new Error(bodyError);
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
  }, []);

  const buildWebLlmProvider = useCallback((config: ProviderConfigState): Provider => {
    if (!config.model?.trim()) {
      throw new Error('Model is required for WebLLM.');
    }
    const responseFormat = (config.responseFormat === 'json' ? 'json' : 'stream') as 'stream' | 'json';
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
    return new WebLlmProvider({
      model: config.model.trim(),
      systemMessage: config.systemMessage?.trim() || undefined,
      responseFormat,
      engineConfig: engineConfig as MLCEngineConfig,
      chatCompletionOptions: completionOptions,
    });
  }, []);

  const buildProvider = useCallback(
    (providerId: ProviderId, config: ProviderConfigState): Provider => {
      switch (providerId) {
        case 'openai':
          return buildOpenaiProvider(config);
        case 'anthropic':
          return buildAnthropicProvider(config);
        case 'gemini':
          return buildGeminiProvider(config);
        case 'webllm':
          return buildWebLlmProvider(config);
        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }
    },
    [buildAnthropicProvider, buildGeminiProvider, buildOpenaiProvider, buildWebLlmProvider]
  );

  const connect = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus({ type: 'idle' });
      setIsConnecting(true);
      try {
        const provider = buildProvider(state.selectedProviderId, selectedConfig);
        const client = createLlmClient(provider);
        setStatus({ type: 'success', message: 'Connection ready. Client created successfully.' });
        onReady(client, {
          providerId: state.selectedProviderId,
          provider,
          rawConfig: selectedConfig,
        });
      } catch (error) {
        setStatus({ type: 'error', message: (error as Error).message });
      } finally {
        setIsConnecting(false);
      }
    },
    [buildProvider, onReady, selectedConfig, state.selectedProviderId]
  );

  const fetchModels = useCallback(async () => {
    setIsFetchingModels(true);
    setStatus({ type: 'idle' });
    try {
      let models: string[] = [];
      if (state.selectedProviderId === 'openai') {
        const mode = (selectedConfig.mode ?? 'direct').toLowerCase();
        const headers: Record<string, string> = {};
        const { value: extraHeaders, error } = parseJsonObject(selectedConfig.headers, 'Headers');
        if (error) {
          throw new Error(error);
        }
        Object.assign(headers, normalizeHeaders(extraHeaders));
        if (mode === 'direct') {
          if (!selectedConfig.apiKey?.trim()) {
            throw new Error('API key required to fetch OpenAI models.');
          }
          headers['Authorization'] = `Bearer ${selectedConfig.apiKey.trim()}`;
        }
        const baseUrl = selectedConfig.baseUrl?.trim() || 'https://api.openai.com/v1/chat/completions';
        const apiRoot = baseUrl.replace(/\/chat\/?.*/, '');
        const response = await fetch(`${apiRoot}/models`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        const payload = await response.json();
        models = (payload.data ?? []).map((item: { id: string }) => item.id);
      } else if (state.selectedProviderId === 'anthropic') {
        const headers: Record<string, string> = {};
        const { value: extraHeaders, error } = parseJsonObject(selectedConfig.headers, 'Headers');
        if (error) {
          throw new Error(error);
        }
        Object.assign(headers, normalizeHeaders(extraHeaders));
        const mode = (selectedConfig.mode ?? 'direct').toLowerCase();
        if (mode === 'direct') {
          if (!selectedConfig.apiKey?.trim()) {
            throw new Error('API key required to fetch Claude models.');
          }
          headers['x-api-key'] = selectedConfig.apiKey.trim();
          headers['anthropic-version'] = selectedConfig.anthropicVersion?.trim() || '2023-06-01';
        }
        const baseUrl = selectedConfig.baseUrl?.trim() || 'https://api.anthropic.com/v1/messages';
        const apiRoot = baseUrl.replace(/\/messages?$/, '');
        const response = await fetch(`${apiRoot}/models`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        const payload = await response.json();
        models = (payload.data ?? []).map((item: { id?: string; name?: string }) => item.id ?? item.name).filter(Boolean) as string[];
      } else if (state.selectedProviderId === 'gemini') {
        const headers: Record<string, string> = {};
        const { value: extraHeaders, error } = parseJsonObject(selectedConfig.headers, 'Headers');
        if (error) {
          throw new Error(error);
        }
        Object.assign(headers, normalizeHeaders(extraHeaders));
        const baseUrl = selectedConfig.baseUrl?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
        let url = `${baseUrl}/models`;
        if ((selectedConfig.mode ?? 'direct').toLowerCase() !== 'proxy') {
          if (!selectedConfig.apiKey?.trim()) {
            throw new Error('API key required to fetch Gemini models.');
          }
          url += `?key=${encodeURIComponent(selectedConfig.apiKey.trim())}`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        const payload = await response.json();
        models = (payload.models ?? []).map((item: { name: string }) => item.name?.split('/').pop()).filter(Boolean) as string[];
      } else {
        throw new Error('Model discovery is not supported for this provider.');
      }

      if (!models.length) {
        throw new Error('No models returned by the provider.');
      }
      setModelOptions(models);
      if (!models.includes(selectedConfig.model)) {
        updateProviderConfig(state.selectedProviderId, 'model', models[0]!);
      }
      setStatus({ type: 'success', message: `Fetched ${models.length} models.` });
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message });
    } finally {
      setIsFetchingModels(false);
    }
  }, [selectedConfig, state.selectedProviderId, updateProviderConfig]);

  const renderSecurityNotice = useCallback(
    () => (
      <p className="lc-hint">
        API keys never leave the browser. Clear your storage if you use a shared device.
      </p>
    ),
    []
  );

  const commonFields = useMemo(() => {
    const mode = selectedConfig.mode ?? 'direct';
    const responseFormat = selectedConfig.responseFormat ?? 'stream';
    return (
      <>
        {state.selectedProviderId !== 'webllm' && (
          <label className="lc-field">
            <span>Connection Mode</span>
            <select value={mode} onChange={(event) => updateProviderConfig(state.selectedProviderId, 'mode', event.target.value)}>
              <option value="direct">Direct (API key stored locally)</option>
              <option value="proxy">Proxy (custom endpoint)</option>
            </select>
          </label>
        )}
        <label className="lc-field">
          <span>Model</span>
          <div className="lc-field-inline">
            <input
              type="text"
              value={selectedConfig.model ?? ''}
              onChange={(event) => updateProviderConfig(state.selectedProviderId, 'model', event.target.value)}
              placeholder="Model identifier"
              required
            />
            {state.selectedProviderId !== 'webllm' && (
              <button type="button" onClick={fetchModels} disabled={isFetchingModels}>
                {isFetchingModels ? 'Fetching…' : 'Fetch models'}
              </button>
            )}
          </div>
          {modelOptions.length > 0 && (
            <select
              value={selectedConfig.model}
              onChange={(event) => updateProviderConfig(state.selectedProviderId, 'model', event.target.value)}
            >
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="lc-field">
          <span>Response Format</span>
          <select
            value={responseFormat}
            onChange={(event) => updateProviderConfig(state.selectedProviderId, 'responseFormat', event.target.value)}
          >
            <option value="stream">Stream tokens</option>
            <option value="json">Single JSON response</option>
          </select>
        </label>
        <label className="lc-field">
          <span>System Prompt (optional)</span>
          <textarea
            value={selectedConfig.systemMessage ?? ''}
            onChange={(event) => updateProviderConfig(state.selectedProviderId, 'systemMessage', event.target.value)}
            rows={2}
            placeholder="e.g. You are a helpful assistant."
          />
        </label>
      </>
    );
  }, [fetchModels, isFetchingModels, modelOptions, selectedConfig, state.selectedProviderId, updateProviderConfig]);

  const renderProviderSpecificFields = () => {
    switch (state.selectedProviderId) {
      case 'openai':
        return (
          <>
            {commonFields}
            {(selectedConfig.mode ?? 'direct') !== 'proxy' && (
              <label className="lc-field">
                <span>API Key</span>
                <input
                  type="password"
                  value={selectedConfig.apiKey ?? ''}
                  onChange={(event) => updateProviderConfig('openai', 'apiKey', event.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                />
              </label>
            )}
            <label className="lc-field">
              <span>Base URL</span>
              <input
                type="text"
                value={selectedConfig.baseUrl ?? ''}
                onChange={(event) => updateProviderConfig('openai', 'baseUrl', event.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
              />
            </label>
            <label className="lc-field">
              <span>Custom Headers (JSON)</span>
              <textarea
                value={selectedConfig.headers ?? ''}
                onChange={(event) => updateProviderConfig('openai', 'headers', event.target.value)}
                placeholder='{ "X-Example": "value" }'
                rows={2}
              />
            </label>
            <label className="lc-field">
              <span>Request Body Overrides (JSON)</span>
              <textarea
                value={selectedConfig.body ?? ''}
                onChange={(event) => updateProviderConfig('openai', 'body', event.target.value)}
                placeholder='{ "temperature": 0.7 }'
                rows={2}
              />
            </label>
            {renderSecurityNotice()}
          </>
        );
      case 'anthropic':
        return (
          <>
            {commonFields}
            {(selectedConfig.mode ?? 'direct') !== 'proxy' && (
              <label className="lc-field">
                <span>API Key</span>
                <input
                  type="password"
                  value={selectedConfig.apiKey ?? ''}
                  onChange={(event) => updateProviderConfig('anthropic', 'apiKey', event.target.value)}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                />
              </label>
            )}
            <label className="lc-field">
              <span>Base URL</span>
              <input
                type="text"
                value={selectedConfig.baseUrl ?? ''}
                onChange={(event) => updateProviderConfig('anthropic', 'baseUrl', event.target.value)}
                placeholder="https://api.anthropic.com/v1/messages"
              />
            </label>
            <label className="lc-field">
              <span>Anthropic Version</span>
              <input
                type="text"
                value={selectedConfig.anthropicVersion ?? '2023-06-01'}
                onChange={(event) => updateProviderConfig('anthropic', 'anthropicVersion', event.target.value)}
              />
            </label>
            <label className="lc-field">
              <span>Max Output Tokens</span>
              <input
                type="number"
                min={1}
                value={selectedConfig.maxOutputTokens ?? '1024'}
                onChange={(event) => updateProviderConfig('anthropic', 'maxOutputTokens', event.target.value)}
              />
            </label>
            <label className="lc-field">
              <span>Custom Headers (JSON)</span>
              <textarea
                value={selectedConfig.headers ?? ''}
                onChange={(event) => updateProviderConfig('anthropic', 'headers', event.target.value)}
                rows={2}
                placeholder='{ "X-Example": "value" }'
              />
            </label>
            <label className="lc-field">
              <span>Request Body Overrides (JSON)</span>
              <textarea
                value={selectedConfig.body ?? ''}
                onChange={(event) => updateProviderConfig('anthropic', 'body', event.target.value)}
                rows={2}
                placeholder='{ "temperature": 1 }'
              />
            </label>
            {renderSecurityNotice()}
          </>
        );
      case 'gemini':
        return (
          <>
            {commonFields}
            {(selectedConfig.mode ?? 'direct') !== 'proxy' && (
              <label className="lc-field">
                <span>API Key</span>
                <input
                  type="password"
                  value={selectedConfig.apiKey ?? ''}
                  onChange={(event) => updateProviderConfig('gemini', 'apiKey', event.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                />
              </label>
            )}
            <label className="lc-field">
              <span>Base URL</span>
              <input
                type="text"
                value={selectedConfig.baseUrl ?? ''}
                onChange={(event) => updateProviderConfig('gemini', 'baseUrl', event.target.value)}
                placeholder="https://generativelanguage.googleapis.com/v1beta"
              />
            </label>
            <label className="lc-field">
              <span>Custom Headers (JSON)</span>
              <textarea
                value={selectedConfig.headers ?? ''}
                onChange={(event) => updateProviderConfig('gemini', 'headers', event.target.value)}
                rows={2}
                placeholder='{ "X-Example": "value" }'
              />
            </label>
            <label className="lc-field">
              <span>Request Body Overrides (JSON)</span>
              <textarea
                value={selectedConfig.body ?? ''}
                onChange={(event) => updateProviderConfig('gemini', 'body', event.target.value)}
                rows={2}
                placeholder='{ "temperature": 0.7 }'
              />
            </label>
            {renderSecurityNotice()}
          </>
        );
      case 'webllm':
        return (
          <>
            {commonFields}
            <label className="lc-field">
              <span>Engine Config (JSON)</span>
              <textarea
                value={selectedConfig.engineConfig ?? ''}
                onChange={(event) => updateProviderConfig('webllm', 'engineConfig', event.target.value)}
                rows={2}
                placeholder='{ "numThreads": 4 }'
              />
            </label>
            <label className="lc-field">
              <span>Chat Completion Options (JSON)</span>
              <textarea
                value={selectedConfig.chatCompletionOptions ?? ''}
                onChange={(event) => updateProviderConfig('webllm', 'chatCompletionOptions', event.target.value)}
                rows={2}
                placeholder='{ "temperature": 0.7 }'
              />
            </label>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <form className="llm-connector" onSubmit={connect}>
      <header className="lc-header">
        <h2>LLM Connector</h2>
        <p>Select a provider, enter credentials once, and reuse a unified client in your app.</p>
      </header>

      <label className="lc-field">
        <span>Provider</span>
        <select value={state.selectedProviderId} onChange={(event) => handleProviderChange(event.target.value as ProviderId)}>
          {PROVIDER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="lc-hint">{PROVIDER_OPTIONS.find((option) => option.id === state.selectedProviderId)?.description}</p>

      {renderProviderSpecificFields()}

      <footer className="lc-footer">
        <button type="submit" disabled={isConnecting}>
          {isConnecting ? 'Preparing…' : 'Connect'}
        </button>
        {status.type !== 'idle' && (
          <span className={`lc-status lc-status-${status.type}`}>
            {status.message}
          </span>
        )}
      </footer>
    </form>
  );
};

export type { LlmConnectorProps, ProviderContext };
export default LlmConnector;




