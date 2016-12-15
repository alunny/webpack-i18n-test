// based on https://github.com/webpack/i18n-webpack-plugin
// but tweaked for Twitter specific quirks (different second param in particular)

var BasicEvaluatedExpression = require('webpack/lib/BasicEvaluatedExpression');
var ConstDependency = require('webpack/lib/dependencies/ConstDependency');
var walk = require('acorn/dist/walk');

var I18N_LIB = './i18n-lib';

function TwitterI18NPlugin(phrases, options) {
  if (typeof phrases !== 'object') {
    throw new Error('TwitterI18NPlugin: missing phrases object');
  }
  this.options = options || {};
  this.phrases = phrases;
}

TwitterI18NPlugin.prototype.apply = function(compiler) {
  var phrases = this.phrases;
  var asts = {};

  function transformAst(ast, expr, currentWebpackState) {
    var initialState = {
      currentWebpackState: currentWebpackState,
      i18nIdentifier: null,
      phrases: phrases,
      requireExpr: expr
    };

    walk.simple(ast, {
      CallExpression: function(node, state) {
        if (!state.i18nIdentifier) {
          return;
        }

        if (node.callee.type === 'Identifier' && node.callee.name === state.i18nIdentifier) {
          var firstI18nArg = node.arguments[0];
          if (!firstI18nArg || firstI18nArg.type !== 'Literal') {
            throw new Error('First argument to i18n function must be a string literal');
          }
          var translation = state.phrases[firstI18nArg.value];

          if (translation) {
            // replace full function call, or just the first arg if there are multiple
            var source = node.arguments.length > 1 ? node.arguments[0] : node;
            var dep = new ConstDependency(JSON.stringify(translation), source.range);
            dep.loc = source.loc;
            state.currentWebpackState.addDependency(dep);
          }
        }
      },
      VariableDeclarator: function(node, state) {
        if (node.init === state.requireExpr) {
          state.i18nIdentifier = node.id.name;
        }
      }
    }, null, initialState);
  }

  compiler.plugin('compilation', function(compilation, params) {
    compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
  });

  // hold onto reference to ast
  compiler.parser.plugin('program', function(ast) {
    asts[this.state.current.rawRequest] = ast;
  });

  // check for dependency on core/i18n
  compiler.parser.plugin('call require:commonjs:item', function(expr, param) {
    var key = this.state.current.rawRequest;

    if (param.string === I18N_LIB) {
      transformAst(asts[key], expr, this.state.current);
      delete asts[key];
    }
  });
};

module.exports = TwitterI18NPlugin;
