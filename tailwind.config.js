/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: update this to include the paths to all files that contain Tailwind classes.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Tola dark-first palette (placeholder accent — finalized in Phase 8 via moodboard)
        bg: {
          DEFAULT: '#0B0B0F', // app background (near-black)
          elevated: '#16161D', // cards / sheets
          subtle: '#1F1F29', // chips / inputs
        },
        fg: {
          DEFAULT: '#F5F5F7', // primary text
          muted: '#A1A1AA', // secondary text
          faint: '#6B6B76', // tertiary / disabled
        },
        accent: {
          DEFAULT: '#6EE7B7', // placeholder mint accent
          muted: '#2DD4BF',
        },
        macro: {
          protein: '#60A5FA',
          carbs: '#FBBF24',
          fat: '#F472B6',
        },
        border: '#26262F',
      },
    },
  },
  plugins: [],
};
