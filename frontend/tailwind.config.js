/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#dbede3',
          200: '#b8dbc8',
          300: '#8cc3a7',
          400: '#5ea482',
          500: '#3d8a66',
          600: '#2d6e51',
          700: '#245842',
          800: '#1f4736',
          900: '#1a3b2d',
        },
        earth: {
          50: '#f8f6f3',
          100: '#ede8df',
          200: '#ddd3c2',
          300: '#c8b89d',
          400: '#b39a78',
          500: '#a5885f',
          600: '#987753',
          700: '#7f6046',
          800: '#69503c',
          900: '#584333',
        },
      },
    },
  },
  plugins: [],
}
