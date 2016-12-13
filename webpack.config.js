var I18NPlugin = require('.');

var phrases = {
  'en': {
    'Hello World': 'Hello World',
    'Hello {{person}}': 'Hello {{person}}'
  },
  'es': {
    'Hello World': 'Hola Mundo',
    'Hello {{person}}': 'Hola {{person}}'
  }
};

module.exports = ['en', 'es'].reduce(function(configs, lang) {
  var plugin = new I18NPlugin(phrases[lang]);

  return configs.concat([
    {
      entry: './examples/bound',
      output: {
        path: './dist',
        filename: 'bound.' + lang + '.js'
      },
      plugins: [ plugin ]
    },
    {
      entry: './examples/unbound',
      output: {
        path: './dist',
        filename: 'unbound.' + lang + '.js'
      },
      plugins: [ plugin ]
    }
  ]);
}, []);
