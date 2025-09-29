// types.ts for TokenUsage

/**
 * Defines the locale strings for the TokenUsage component.
 * All fields are optional to allow for partial overrides.
 */
export interface TokenUsageLocale {
  title?: string;
  inputLabel?: string;
  outputLabel?: string;
}

/**
 * Props for the public-facing TokenUsage components (En/Zh).
 */
export interface TokenUsageProps {
  className?: string;
  locale?: TokenUsageLocale;
}