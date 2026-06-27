/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        muted: '#27272a',
        'muted-foreground': '#a1a1aa',
        border: '#27272a',
        primary: '#fafafa',
        'primary-foreground': '#09090b',
        accent: '#27272a',
        'accent-foreground': '#fafafa',
      },
    },
  },
  plugins: [],
}
