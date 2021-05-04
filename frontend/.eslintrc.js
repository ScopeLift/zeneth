module.exports = {
  extends: ['../.eslintrc', 'plugin:react/recommended'],
  parserOptions: {
    project: 'tsconfig.json',
    parser: '@typescript-eslint/parser',
  },
};
