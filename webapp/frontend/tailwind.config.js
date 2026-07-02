/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Airbnb 色板 ──
        rausch: {
          DEFAULT: '#ff385c',
          active: '#e00b41',
          disabled: '#ffd1da',
        },
        ink: {
          DEFAULT: '#222222',
        },
        body: {
          DEFAULT: '#3f3f3f',
        },
        muted: {
          DEFAULT: '#6a6a6a',
          soft: '#929292',
        },
        hairline: {
          DEFAULT: '#dddddd',
          soft: '#ebebeb',
          strong: '#c1c1c1',
        },
        canvas: {
          DEFAULT: '#ffffff',
        },
        surface: {
          soft: '#f7f7f7',
          strong: '#f2f2f2',
          card: '#ffffff',
        },
        error: {
          DEFAULT: '#c13515',
          hover: '#b32505',
        },
        legal: {
          link: '#428bff',
        },
        // 兼容保留 old primary
        primary: {
          50: '#fff0f3',
          100: '#ffd1da',
          200: '#ffa3b3',
          300: '#ff758c',
          400: '#ff4765',
          500: '#ff385c',
          600: '#e00b41',
          700: '#cc0033',
          800: '#990026',
          900: '#660019',
        },
      },
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '32px',
        full: '9999px',
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '64px',
      },
      fontFamily: {
        sans: [
          'Circular',
          '-apple-system',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-xl': ['28px', { lineHeight: '1.43', fontWeight: '700' }],
        'display-lg': ['22px', { lineHeight: '1.18', fontWeight: '500', letterSpacing: '-0.44px' }],
        'display-md': ['21px', { lineHeight: '1.43', fontWeight: '700' }],
        'display-sm': ['20px', { lineHeight: '1.20', fontWeight: '600', letterSpacing: '-0.18px' }],
        'title-md': ['16px', { lineHeight: '1.25', fontWeight: '600' }],
        'title-sm': ['16px', { lineHeight: '1.25', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.43', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.29', fontWeight: '500' }],
        'caption-sm': ['13px', { lineHeight: '1.23', fontWeight: '400' }],
        badge: ['11px', { lineHeight: '1.18', fontWeight: '600' }],
        'micro-label': ['12px', { lineHeight: '1.33', fontWeight: '700' }],
        'button-md': ['16px', { lineHeight: '1.25', fontWeight: '500' }],
        'button-sm': ['14px', { lineHeight: '1.29', fontWeight: '500' }],
      },
      boxShadow: {
        // Airbnb 唯一阴影层级 — 只有 hover 时使用
        'card-float': 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px',
      },
    },
  },
  plugins: [],
}
