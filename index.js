// based on https://github.com/webpack/i18n-webpack-plugin
// but tweaked for Twitter specific quirks (different second param in particular)

var BasicEvaluatedExpression = require('webpack/lib/BasicEvaluatedExpression');
var ConstDependency = require('webpack/lib/dependencies/ConstDependency');

function TwitterI18NPlugin(phrases, options) {
  if (typeof phrases !== 'object') {
    throw new Error('TwitterI18NPlugin: missing phrases object');
  }
  this.options = options || {};
  this.phrases = phrases;
}

TwitterI18NPlugin.prototype.apply = function(compiler) {
  var phrases = this.phrases;

  compiler.plugin('compilation', function(compilation, params) {
    compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
  });

  // calls to the underscore (translate) function
  // this never gets called when underscore is bound to a variable in the module
  compiler.parser.plugin('call _', function(expr) {
    var param = this.evaluateExpression(expr.arguments[0]);
    if (!param.isString) {
      return;
    }
    var str = param.string;

    var translation = phrases[str];

    if (translation) {
      // replace full function call, or just the first arg if there are multiple
      var source = expr.arguments.length > 1 ? expr.arguments[0] : expr;
      var dep = new ConstDependency(JSON.stringify(translation), source.range);
      dep.loc = source.loc;
      this.state.current.addDependency(dep);

      return true;
    }
  });
};

module.exports = TwitterI18NPlugin;
