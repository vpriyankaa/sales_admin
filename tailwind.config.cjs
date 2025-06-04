module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // ✅ keep only here

  theme: {
    extend: {
      screens: {
        '2xsm': '375px',
      },
      colors: {
        primary: '#3b82f6',
        stroke: '#d1d5db',
        'stroke-dark-3': '#1f2937',
        'dark-2': '#1a1a1a',
        'dark-3': '#374151',
        'gray-dark': '#111827',
        dark: '#0f172a',
        'text-dark': '#0f172a',
        'border-b-gray': '#e5e7eb',
        'border-b-dark': '#1f2937',
        'fill-dark-5': '#6b7280',
        'fill-dark-6': '#4b5563',
        'gray-2': '#e0e0e0',
      },
      fontSize: {
        'body-sm': ['0.875rem', '1.25rem'],
      },
      boxShadow: {
        'card-2': '0 4px 10px rgba(0, 0, 0, 0.05)',
        'datepicker': '0 4px 10px rgba(0,0,0,0.25)',
      },
    },
  },

  plugins: [],
};
