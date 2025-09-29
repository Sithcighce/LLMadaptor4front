
// types.ts for ModelSelect

/**
 * Defines the locale strings for the ModelSelect component.
 * All fields are optional to allow for partial overrides.
 */
export interface ModelSelectLocale {
  title?: string;
  placeholder?: string;
  fetchButton?: string;
  fetching?: string;
  empty?: string;
}

/**
 * Props for the public-facing ModelSelect components (En/Zh).
 */
export interface ModelSelectProps {
  className?: string;
  locale?: ModelSelectLocale;
}
