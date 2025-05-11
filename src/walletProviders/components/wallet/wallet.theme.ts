// components/wallet/wallet.theme.ts

/**
 * Default theme configuration for the wallet component
 * 
 * @description
 * WALLET_DEFAULT_THEME defines the default visual styling for the wallet component.
 * It uses CSS custom properties (variables) to define various aspects of the UI,
 * making it easy to customize the appearance while maintaining consistency.
 * 
 * The theme includes:
 * - Background colors for different UI elements
 * - Text colors for various content types
 * - Border and input field styling
 * - Button appearance
 * - Spacing and sizing measurements
 * 
 * @example
 * ```typescript
 * // Override specific theme values
 * const customTheme = {
 *   ...WALLET_DEFAULT_THEME,
 *   '--wallet-bg-primary': '#000000',
 *   '--wallet-text-primary': '#ffffff'
 * };
 * ```
 */
export const WALLET_DEFAULT_THEME = {
  /** Primary background color for the wallet container */
  '--wallet-bg-primary': '#10141A',
  /** Secondary background color for UI elements like buttons */
  '--wallet-bg-secondary': '#181C23',

  /** Primary text color for main content */
  '--wallet-text-primary': '#FFFFFF',
  /** Secondary text color for supporting content */
  '--wallet-text-secondary': '#A3A9B6',

  /** Border color for UI elements */
  '--wallet-border-color': '#232833',
  /** Border color for input fields */
  '--wallet-input-border-color': '#232833',
  /** Text color for input fields */
  '--wallet-input-text-color': '#A3A9B6',

  /** Background color for primary action buttons */
  '--wallet-button-bg': '#1DA1F2',
  /** Text color for primary action buttons */
  '--wallet-button-text-color': '#FFFFFF',

  /** Padding for the main container */
  '--wallet-container-padding': 16,
  /** Vertical padding for buttons */
  '--wallet-button-padding': 12,
  /** Base font size for text elements */
  '--wallet-font-size': 14,
};
