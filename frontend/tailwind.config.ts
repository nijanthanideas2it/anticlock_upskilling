import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Override default palette at the root level so gray/blue map to our brand
    colors: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent',
      black: '#000000',
      white: '#FFFFFF',

      // Material neutral palette — replaces Tailwind gray
      gray: {
        50:  '#F4F5F7',
        100: '#EBECF0',
        200: '#DFE1E6',
        300: '#C1CAD8',
        400: '#8993A4',
        500: '#6B778C',
        600: '#505F79',
        700: '#344563',
        800: '#172B4D',
        900: '#091E42',
      },

      // Material primary palette — replaces Tailwind blue
      blue: {
        50:  '#E4F2FF',
        100: '#D4E3FF',
        200: '#ADC6FF',
        300: '#85A4FF',
        400: '#4D7FFF',
        500: '#0052CC',
        600: '#0047B0',
        700: '#003D9B',
        800: '#003082',
        900: '#001B41',
      },

      // Material tertiary — info / teal
      teal: {
        50:  '#E3F4FD',
        100: '#B3ECFD',
        400: '#00B8D9',
        600: '#0097B2',
        700: '#006B82',
        900: '#001F27',
      },

      // Status: error
      red: {
        50:  '#FFEBE6',
        100: '#FFBDAD',
        200: '#FF8F73',
        400: '#FF5630',
        500: '#DE350B',
        600: '#BF2600',
        700: '#A81900',
        800: '#8F1300',
      },

      // Status: success
      green: {
        50:  '#E3FCEF',
        100: '#ABF5D1',
        300: '#57D9A3',
        400: '#36B37E',
        500: '#00875A',
        600: '#006644',
        700: '#004D40',
      },

      // Status: warning
      amber: {
        50:  '#FFFAE6',
        100: '#FFF0B3',
        200: '#FFE380',
        300: '#FFC400',
        400: '#FFAB00',
        500: '#FF8B00',
        700: '#7A3500',
        800: '#5B2500',
      },
      yellow: {
        50:  '#FFFAE6',
        100: '#FFF0B3',
        200: '#FFE380',
        500: '#FFAB00',
        700: '#7A3500',
      },

      // Priority: high/orange
      orange: {
        50:  '#FFF4EC',
        100: '#FFE8D6',
        400: '#FF8030',
        600: '#C24D00',
        800: '#7A2E00',
      },

    },

    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:      '3px',
        DEFAULT: '4px',
        md:      '6px',
        lg:      '8px',
        xl:      '12px',
        '2xl':   '16px',
        full:    '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
