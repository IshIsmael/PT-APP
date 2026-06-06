/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Tola — "grows with you": warm, organic, human. Earth tones, dark-first.
        bg: {
          DEFAULT: '#171210', // warm espresso (not cold black)
          elevated: '#221A15', // cards / sheets
          subtle: '#2C2219', // chips / inputs
        },
        fg: {
          DEFAULT: '#F4EADE', // warm cream
          muted: '#C5B3A1', // secondary
          faint: '#8C7B6C', // tertiary / disabled
        },
        accent: {
          DEFAULT: '#E07A5F', // terracotta / clay
          muted: '#C8624A',
        },
        // Growth / positive signal.
        sage: {
          DEFAULT: '#9CA87E',
          deep: '#7E8C63',
        },
        honey: '#E6B84C',
        macro: {
          protein: '#D8674A', // clay
          carbs: '#E6B84C', // honey
          fat: '#9CA87E', // sage
        },
        border: '#3A2D24',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'sans-serif'],
        medium: ['Inter_500Medium', 'sans-serif'],
        semibold: ['Inter_600SemiBold', 'sans-serif'],
        display: ['Fraunces_600SemiBold', 'serif'],
        'display-bold': ['Fraunces_700Bold', 'serif'],
      },
    },
  },
  plugins: [],
};
