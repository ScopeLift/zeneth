module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      transitionDelay: {
        5000: '5000ms',
      },
    },
  },
  variants: {
    extend: {
      cursor: ['hover'],
    },
  },
  plugins: [],
};
