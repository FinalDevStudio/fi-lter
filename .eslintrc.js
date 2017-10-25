module.exports = {

  extends: 'airbnb-base',

  root: true,

  parserOptions: {
    sourceType: 'module'
  },

  env: {
    node: true,
    es6: true
  },

  rules: {
    'no-console': 'off',
    'require-jsdoc': 'warn',
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'valid-jsdoc': ['warn', {
      'requireReturn': false,
      'prefer': {
        'return': 'returns'
      }
    }]
  }

}
