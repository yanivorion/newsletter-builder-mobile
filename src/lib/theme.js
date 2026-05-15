// Electreon Brand Colors
export const electreonTheme = {
  name: 'Electreon',
  colors: {
    primary: {
      electricBlue: '#04D1FC',
      black: '#120F0F',
      white: '#FFFFFF',
    },
    greys: {
      grey1: '#F7F7F7',
      grey2: '#E1E1E1',
      grey3: '#B2B2B2',
      grey4: '#878787',
      grey5: '#5E5E5E',
    },
    accents: {
      horizon: '#F2D64C',
      persianGreen: '#17A298',
      settleEmber: '#FF7B3E',
      deepPurple: '#5B2C6F',
    },
  },
  gradients: {
    primaryGradient: {
      name: 'Electric Blue Fade',
      start: '#04D1FC',
      end: '#17A298',
    },
    darkGradient: {
      name: 'Dark Fade',
      start: '#120F0F',
      end: '#5E5E5E',
    },
    sunsetGradient: {
      name: 'Sunset',
      start: '#FF7B3E',
      end: '#F2D64C',
    },
    purpleGradient: {
      name: 'Deep Purple',
      start: '#5B2C6F',
      end: '#04D1FC',
    },
  },
};

// Default neutral theme
export const defaultTheme = {
  name: 'Default',
  colors: {
    primary: {
      main: '#18181B',
      secondary: '#27272A',
      white: '#FFFFFF',
    },
    greys: {
      grey1: '#FAFAFA',
      grey2: '#F4F4F5',
      grey3: '#E4E4E7',
      grey4: '#A1A1AA',
      grey5: '#71717A',
    },
    accents: {
      blue: '#3B82F6',
      green: '#22C55E',
      orange: '#F97316',
      purple: '#8B5CF6',
    },
  },
  gradients: {
    primaryGradient: {
      name: 'Dark Gradient',
      start: '#18181B',
      end: '#27272A',
    },
  },
};

// Get all colors as flat array for color picker
export function getThemeColors(theme) {
  const colors = [];
  
  Object.entries(theme.colors).forEach(([category, colorGroup]) => {
    Object.entries(colorGroup).forEach(([name, value]) => {
      colors.push({ name, value, category });
    });
  });
  
  return colors;
}

// Get all gradients as array
export function getThemeGradients(theme) {
  return Object.entries(theme.gradients).map(([key, gradient]) => ({
    id: key,
    ...gradient,
  }));
}

