import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bimbo: {
          blue: '#003366',       // Azul Marino Corporativo Bimbo
          navy: '#002244',       // Azul Oscuro de Contraste
          red: '#D9222A',        // Rojo Bimbo Oficial
          redHover: '#B91C1C',   // Rojo Hover
          amber: '#F59E0B',      // Ámbar para Advertencias
          green: '#10B981',      // Verde Operativo Normal
          gray: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
        },
      },
      minHeight: {
        touch: '52px',
      },
      minWidth: {
        touch: '52px',
      },
    },
  },
  plugins: [],
};

export default config;
