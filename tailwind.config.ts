import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF4B12',
          cream: '#FFF6EC',
          ink: '#241708',
        },
      },
    },
  },
  plugins: [],
}
export default config
