// types.ts for ConnectionForm

/**
 * Defines the locale strings for the ConnectionForm component.
 * All fields are optional to allow for partial overrides.
 */
export interface ConnectionFormLocale {
  title?: string;
  statusLabel?: string;
  statusConnected?: string;
  statusNotConnected?: string;
  statusConnecting?: string;
  providerLabel?: string;
  apiKeyLabel?: string;
  apiKeyPlaceholder?: string;
  connectButton?: string;
  disconnectButton?: string;
}

/**
 * Props for the public-facing ConnectionForm components (En/Zh).
 * The base component's props are now internal.
 */
export interface ConnectionFormProps {
  className?: string;
  locale?: ConnectionFormLocale;
  /** 可选的Client名称，用于显式查找Client实例 */
  clientName?: string;
}