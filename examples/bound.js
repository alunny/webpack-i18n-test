// in this example, the strings are not replaced correctly
var _ = require('./i18n-lib');

module.exports = [
  _('Hello World'),
  _('Hello {{person}}', { person: 'Sean' })
];
