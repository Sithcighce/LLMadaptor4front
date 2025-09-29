import React from 'react';
import clsx from 'clsx';
import { useLlmConnector } from '../../hooks/useLlmConnector';
import type { ConnectionFormLocale } from './types';

// Redefined props: The component now only needs customization props.
// All state and handlers are consumed from the context.
interface ConnectionFormProps {
  className?: string;
  locale?: Partial<ConnectionFormLocale>;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ className, locale: localeOverride }) => {
  // Consume the logic from the context
  const { states, handlers } = useLlmConnector();

  // Locale setup is now internal, but can be overridden by props
  const defaultLocale: ConnectionFormLocale = {
    title: '2. Connection Settings',
    statusLabel: 'Status',
    statusConnected: 'Connected',
    statusNotConnected: 'Not Connected',
    statusConnecting: 'Connecting...',
    providerLabel: 'Provider',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'Enter your API Key here',
    connectButton: 'Connect',
    disconnectButton: 'Disconnect',
  };

  const locale = { ...defaultLocale, ...localeOverride }; 

  const isConnecting = states.status === 'connecting';
  const isConnected = states.status === 'connected';

  const getStatusText = () => {
    if (states.status === 'connecting') return locale.statusConnecting;
    if (states.status === 'connected') return locale.statusConnected;
    return locale.statusNotConnected;
  };

  return (
    <div className={`mb-8 ${className || ''}`}>
      <h2 className="text-lg font-semibold mb-3 text-gray-400">{locale.title}</h2>
      <div className="p-4 bg-gray-900 rounded-lg space-y-4">
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-gray-400">{locale.statusLabel}</span>
          <div className="flex items-center">
            <div className={clsx('w-2 h-2 rounded-full mr-2', {
              'bg-green-500': isConnected,
              'bg-yellow-500': isConnecting,
              'bg-gray-500': !isConnected && !isConnecting,
            })}></div>
            <span className="text-gray-300">{getStatusText()}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 px-1">{locale.providerLabel}</label>
          <select
            value={states.providerId}
            onChange={(e) => handlers.setProviderId(e.target.value as typeof states.providerId)}
            disabled={isConnecting || isConnected}
            className="w-full py-2 px-3 rounded-md text-sm bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* For now, we hardcode options. The logic hook will provide this later. */}
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 px-1">{locale.apiKeyLabel}</label>
          <input
            type="password"
            placeholder={locale.apiKeyPlaceholder}
            value={states.apiKey}
            onChange={(e) => handlers.setApiKey(e.target.value)}
            disabled={isConnecting || isConnected}
            className="w-full py-2 px-3 rounded-md text-sm bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mt-2 flex">
          {isConnected ? (
            <button
              type="button"
              onClick={handlers.handleDisconnect}
              className="w-full text-sm text-center bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-md transition-colors"
            >
              {locale.disconnectButton}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlers.handleConnect}
              disabled={isConnecting}
              className="w-full text-sm text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {isConnecting ? locale.statusConnecting : locale.connectButton}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;