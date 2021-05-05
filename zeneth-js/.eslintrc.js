module.exports = {
  extends: '../.eslintrc',
  parserOptions: {
    project: 'tsconfig.json',
    parser: '@typescript-eslint/parser',
  },
  rules: {
    '@typescript-eslint/ban-ts-comment': 1, // 0 = off, 1 = warn, 2 = error
  },
};
