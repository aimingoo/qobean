/**
 * Qomo's Base Object Framework
 * - 2008.01.07
 */

// rewrite meta system
MetaClass = Meta(function(fromSource) {
  return new Function('Base', 'return new Base');
}, MetaClass);

MetaObject = Meta(function(fromSource) {
  var atom = {};
  return function() {
    if (this instanceof Function) return new arguments.callee(atom, arguments);
    if (this.Create) this.Create.apply(this, arguments[0]===atom ? arguments[1] : arguments);
  }
}, MetaObject);