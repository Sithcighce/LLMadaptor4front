import React from 'react';
import { useConnectionManager } from '../../hooks/useConnectionManager';
import type { ConnectionFormLocale } from './types';

// 内嵌样式，确保开箱即用
const styles = {
  container: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#9CA3AF', /* text-gray-400 */
  },
  card: {
    padding: '1rem',
    backgroundColor: '#111827', /* bg-gray-900 */
    borderRadius: '0.5rem',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    paddingLeft: '0.25rem',
    paddingRight: '0.25rem',
  },
  statusLabel: {
    color: '#9CA3AF', /* text-gray-400 */
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
  },
  statusDot: {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    marginRight: '0.5rem',
  },
  statusText: {
    color: '#D1D5DB', /* text-gray-300 */
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#9CA3AF', /* text-gray-400 */
    marginBottom: '0.25rem',
    paddingLeft: '0.25rem',
    paddingRight: '0.25rem',
  },
  select: {
    width: '100%',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    backgroundColor: '#1F2937', /* bg-gray-800 */
    border: '1px solid #374151', /* border-gray-700 */
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box' as const, /* 确保 padding 和 border 包含在 width 内 */
  },
  input: {
    width: '100%',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    backgroundColor: '#1F2937', /* bg-gray-800 */
    border: '1px solid #374151', /* border-gray-700 */
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box' as const, /* 确保 padding 和 border 包含在 width 内 */
  },
  buttonContainer: {
    marginTop: '0.5rem',
    display: 'flex',
  },
  button: {
    width: '100%',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    fontWeight: '600',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.15s ease-in-out',
    border: 'none',
    cursor: 'pointer',
  },
  connectButton: {
    backgroundColor: '#4F46E5', /* bg-indigo-600 */
    color: '#FFFFFF',
  },
  disconnectButton: {
    backgroundColor: '#374151', /* bg-gray-700 */
    color: '#D1D5DB', /* text-gray-300 */
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

// Redefined props: The component now only needs customization props.
// All state and handlers are consumed from the context.
interface ConnectionFormProps {
  className?: string;
  locale?: Partial<ConnectionFormLocale>;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ className, locale: localeOverride }) => {
  // Consume the logic from the connection manager
  const {
    providerId, apiKey, status, error,
    setProviderId, setApiKey, handleConnect, handleDisconnect
  } = useConnectionManager();

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

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  const getStatusText = () => {
    if (status === 'connecting') return locale.statusConnecting;
    if (status === 'connected') return locale.statusConnected;
    return locale.statusNotConnected;
  };

  const getStatusDotColor = () => {
    if (isConnected) return '#10B981'; /* bg-green-500 */
    if (isConnecting) return '#F59E0B'; /* bg-yellow-500 */
    return '#6B7280'; /* bg-gray-500 */
  };

  return (
    <div style={{ ...styles.container }} className={className}>
      <h2 style={styles.title}>{locale.title}</h2>
      <div style={styles.card}>
        <div style={styles.cardContent}>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>{locale.statusLabel}</span>
            <div style={styles.statusIndicator}>
              <div style={{
                ...styles.statusDot,
                backgroundColor: getStatusDotColor()
              }}></div>
              <span style={styles.statusText}>{getStatusText()}</span>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{locale.providerLabel}</label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value as typeof providerId)}
              disabled={isConnecting || isConnected}
              style={{
                ...styles.select,
                ...(isConnecting || isConnected ? styles.disabledButton : {})
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{locale.apiKeyLabel}</label>
            <input
              type="password"
              placeholder={locale.apiKeyPlaceholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isConnecting || isConnected}
              style={{
                ...styles.input,
                ...(isConnecting || isConnected ? styles.disabledButton : {})
              }}
            />
          </div>

          {/* 错误信息显示 */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#7F1D1D', /* bg-red-900 */
              border: '1px solid #DC2626', /* border-red-600 */
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#FEF2F2', /* text-red-50 */
            }}>
              <strong>连接失败：</strong> {error.message}
            </div>
          )}

          <div style={styles.buttonContainer}>
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                style={{
                  ...styles.button,
                  ...styles.disconnectButton
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4B5563';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
              >
                {locale.disconnectButton}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                style={{
                  ...styles.button,
                  ...styles.connectButton,
                  ...(isConnecting ? styles.disabledButton : {})
                }}
                onMouseOver={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.backgroundColor = '#4338CA';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.backgroundColor = '#4F46E5';
                  }
                }}
              >
                {isConnecting ? locale.statusConnecting : locale.connectButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;