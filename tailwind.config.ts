import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        'surface-dim': '#d9dadb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#f1f3f5',
        'surface-container-high': '#e9ecef',
        background: '#f8f9fa',
        'on-surface': '#191c1d',
        'on-surface-variant': '#596066',
        outline: '#d1d5db',
        'outline-variant': '#e5e7eb',
        primary: {
          DEFAULT: '#111827',
          hover: '#1f2937',
          focus: '#374151',
        },
        'on-primary': '#ffffff',
        secondary: '#4b5563',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        prose: '720px',
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
