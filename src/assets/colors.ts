const COLORS = {
  // Primary palette
  white: '#FFFFFF',
  black: '#10141A',

  // Dark theme backgrounds
  darkBg: {
    primary: '#10141A',
    secondary: '#181C23',
    tertiary: '#232833',
    accent: '#1DA1F2',
  },
  
  // Dark theme surfaces
  darkSurface: {
    card: '#181C23',
    modal: '#232833',
    popup: '#232833',
  },

  // Grays
  greyLight: '#F6F7F9',
  greyMid: '#A3A9B6',
  greyDark: '#999999',
  greyBorder: '#232833',
  greyBorderdark: '#232833',
  
  // Dark theme text
  darkText: {
    primary: '#FFFFFF',
    secondary: '#A3A9B6',
    tertiary: '#6C7383',
    disabled: '#3A3F4B',
  },

  // Branding & special use
  brandPrimary: '#1DA1F2',
  brandPurple: '#B591FF',
  brandPurpleBg: '#EDECFF',
  
  // Brand colors with opacity variants
  brandPrimaryAlpha: {
    a10: 'rgba(29, 161, 242, 0.1)',
    a20: 'rgba(29, 161, 242, 0.2)',
    a30: 'rgba(29, 161, 242, 0.3)',
    a50: 'rgba(29, 161, 242, 0.5)',
    a70: 'rgba(29, 161, 242, 0.7)',
  },
  
  // Status colors
  status: {
    success: '#00FF00',
    warning: '#ffcc00',
    error: '#ff3b30',
    info: '#34aadc',
  },

  // Other usage
  textDark: '#1E1E1E',
  textHint: '#A3A9B6',
  textLight: '#6C7383',
  cyan: '#1DA1F2',
  
  // Token blue (for USDC icon)
  tokenBlue: '#3B82F6',

  // Gradients (hex values for reference)
  gradients: {
    darkGrey: ['#181C23', '#10141A', '#232833'],
    primary: ['#1DA1F2', '#00FF00', '#3B82F6'],
    danger: ['#E74C3C', '#C0392B'],
  }
};

export default COLORS;
