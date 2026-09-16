/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Darukaa brand palette — earthy greens and deep blues for environmental context
        earth: {
          50: '#f0f9f0',
          100: '#dcf0dc',
          200: '#bbdfc0',
          300: '#87c593',
          400: '#52a463',
          500: '#2e8b47',
          600: '#1f6e35',
          700: '#1a572c',
          800: '#184526',
          900: '#153a22',
        },
        ocean: {
          50: '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3fd',
          300: '#93d1fb',
          400: '#60b5f7',
          500: '#3b95f2',
          600: '#2577e7',
          700: '#1d60d4',
          800: '#1e4eac',
          900: '#1e4388',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
