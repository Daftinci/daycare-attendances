/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F6F5F1',
        surface: '#FFFFFF',
        line: '#E3E1DA',
        'line-strong': '#D5D2C9',
        'line-soft': '#EEEDE8',
        ink: '#1C1F23',
        'ink-2': '#3A3F46',
        muted: '#5B616B',
        primary: { DEFAULT: '#0F6E66', dark: '#0A4F49', tint: '#E3F1EF', ink: '#0A574F' },
        warn: { DEFAULT: '#8A3A06', bg: '#FDF0E6', line: '#F3D3B8', strong: '#B54708' },
        wait: { bg: '#FFF6D6', fg: '#6B4E00' },
        off: { bg: '#EEEDE8', fg: '#4D5259' },
        med: { bg: '#EAF0FB', fg: '#1E4FA3' },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { md: '10px', lg: '14px', xl: '16px' },
      minHeight: { touch: '44px' },
    },
  },
  plugins: [],
};
