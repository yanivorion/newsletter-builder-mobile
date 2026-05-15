/** @type {import('tailwindcss').Config} */
// Minimal Tailwind config. The editor uses the default Tailwind palette
// directly (slate, zinc, red, emerald, etc.) plus inline `var(--…)`
// references defined in src/index.css. The previous shadcn-style HSL color
// mappings have been removed because they collide with the editor's hex
// design tokens.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
