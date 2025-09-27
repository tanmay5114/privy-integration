// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary palette
        white: '#FFFFFF',
        black: '#000000',

        // Dark theme backgrounds
        'dark-bg-primary': '#10151A',
        'dark-bg-secondary': '#181F29',
        'dark-bg-tertiary': '#232B36',
        'dark-bg-accent': '#2C3542',
        
        // Dark theme surfaces
        'dark-surface-card': '#181F29',
        'dark-surface-modal': '#10151A',
        'dark-surface-popup': '#232B36',

        // Grays
        'grey-light': '#8A99A9',
        'grey-mid': '#6B7A8A',
        'grey-dark': '#4A5969',
        'grey-border': '#232833',
        'grey-border-dark': '#232833',
        
        // Dark theme text
        'dark-text-primary': '#FFFFFF',
        'dark-text-secondary': '#8A99A9',
        'dark-text-tertiary': '#6B7A8A',
        'dark-text-disabled': '#3A3F4B',

        // Branding & special use
        'brand-primary': '#1DA1F2',
        'brand-purple': '#B591FF',
        'brand-purple-bg': '#EDECFF',
        
        // Status colors
        'status-success': '#22C55E',
        'status-warning': '#F59E0B',
        'status-error': '#EF4444',
        'status-info': '#3B82F6',

        // Other usage
        'text-dark': '#1E1E1E',
        'text-hint': '#A3A9B6',
        'text-light': '#6C7383',
        cyan: '#1DA1F2',
        
        // Token blue (for USDC icon)
        'token-blue': '#3B82F6',

        // Main colors (shortcuts)
        primary: '#3B82F6',
        secondary: '#6B7A8A',
        accent: '#00FFD1',
        background: '#10151A',
        surface: '#181F29',
        text: '#FFFFFF',
        error: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      backgroundColor: {
        // Background variants
        'bg-primary': '#10151A',
        'bg-secondary': '#181F29',
        'bg-tertiary': '#232B36',
        'bg-card': '#181F29',
        'bg-modal': '#10151A',
      },
      textColor: {
        // Text variants
        'text-primary': '#FFFFFF',
        'text-secondary': '#8A99A9',
        'text-tertiary': '#6B7A8A',
        'text-disabled': '#3A3F4B',
      },
      borderColor: {
        // Border variants
        'border-primary': '#232833',
        'border-secondary': '#232833',
        'border-focus': '#1DA1F2',
      },
      spacing: {
        // Spacing constants
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      borderRadius: {
        // Border radius constants
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'round': '9999px',
      },
      // Gradient utilities
      backgroundImage: {
        'gradient-dark-grey': 'linear-gradient(to bottom, #181C23, #10141A, #232833)',
        'gradient-primary': 'linear-gradient(to bottom, #3B82F6, #2563EB)',
        'gradient-success': 'linear-gradient(to bottom, #22C55E, #16A34A)',
        'gradient-error': 'linear-gradient(to bottom, #EF4444, #DC2626)',
        'gradient-warning': 'linear-gradient(to bottom, #F59E0B, #D97706)',
        'gradient-danger': 'linear-gradient(to bottom, #EF4444, #DC2626)',
        'gradient-card': 'linear-gradient(to bottom, #181F29, #10151A)',
      }
    },
  },
  plugins: [],
}

export default config