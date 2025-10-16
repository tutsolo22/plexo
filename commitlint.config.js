module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'subject-case': [0], // Desabilitar case checking para emojis
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0] // Desabilitar límite de línea en body
  }
};