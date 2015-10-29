/**
 * Meta system, and language abstract
 *   - atom system, request a atom instance with Atom().
 *   - obj system, request objects with Atom().
 *   - func system, request functions with Meta().
 *   - class system, request classes with Class(). the unit in Class.js
 *   - unique instance, use o2 = Unique(o1).
 */

/**
 * A utility, get function or body context(code snippet), with tag:
 *  -  'body', default, return function code context.
 *  -  'name', return function name. it's a string.
 *  -  'param', return function params, it's a array objec.
 *  -  'scope', return function define. it's a string. get a function for a eval() call.
 *  -  'anonymous', return anonymous function, it's a function object.
 */
function Block(func, tag) {
  var _r_function = /^function\b\s*([\$\S]*)\s*\(/;
  var _r_codebody = /[^{]*\{([\d\D]*)\}$/;
  var _r_params = /[^\(]*\(([^\)]*)\)[\d\D]*/;
  tag = (tag || 'body').toLowerCase();
  with (func.toString()) {
    return (tag == 'body') ? replace(_r_codebody, '$1').replace(/^\s*|\s*$/g, '')
      : (tag == 'param') ? ((tag=replace(_r_params, '$1')) ? tag.split(/[,\s]+/) : [])
      : (tag == 'name') ? match(_r_function)[1]
      : (tag == 'scope') ? '[function (' +arguments.callee(func, 'param')+ ') {\n' +arguments.callee(func, 'body')+ '\n}][0]'
      : (tag == 'anonymous') ? Function.apply(this, arguments.callee(func, 'param').concat(arguments.callee(func, 'body')))
      : 'Block() with bad arguments.';
  }
}

/**
 * Weave system
 *  - get a global function, you can weaving and weaving...
 *  - sample: Weave.call(aFunction, rgExp, replaceText), see RegExp.replace()
 * rewrite or weaving?
 *  if you want update again, then you need weaving, weaving and weaving... else
 *  rewrite once. if function need upvalue, can't weaving it! Weave() will change
 *  function's scope thians.
 */
function Weave(where, code) {
  var source = Block(this);
  code = source.replace(where, code);
  return Function.apply(null, Block(this, 'param').concat(code));
}

// Weave system enhance
//  - You can use "$[`&'$]" in <replaceText>, when <rgExp> is string
//  - It's a COOL match patten for line position: /(^.*\n){1}/m
Weave = Weave.call(Weave, /(^.*\n){1}/m, '$&'+Block(function() {
  var x;
  if (((typeof where == 'string') || (where instanceof String)) &&
      ((x = source.indexOf(where)) > -1)) {
    code = code.replace(/\$([\$\&\`\'])/, function(vv0, vv1) {
      return ((vv1 == "`") ? source.substr(0, x)
        : (vv1 == "'") ? source.substr(x+where.length)
        : (vv1 == "&") ? where
        : "$"
      )
    })
  }
}));


// get a unique object from a 'obj'
//  -  clone unique object.
Unique = function(f) {
  return function(obj, func, args) {
    f.prototype = obj;
    return func ? func.apply(new f, args) : new f;
  }
}(new Function);


// Atom system
//  -  atom object for data
function Atom(atom) {
  return atom || {};
}


// Meta system
//  -  meta functional for code
function Meta(func, baseMeta) {
  func.meta = baseMeta || arguments.callee;
  return func;
}


// meta is meta for self.
//   Meta = Meta(Meta);
Meta(Meta);


// Scope system
//  - get a function by <code>, the function running in a specify scope for the <obj>
function Scope(obj, code) {
  switch (obj) {
    case undefined:
    case null: return Block(code, 'anonymous');
    default:
      code = Block(code, 'scope');
      with (obj) return this.eval(code);
  }
}
eval('Scope = ' + Scope.toString().replace(/(code)/g, '__$$$1$$__'));


/**
 * system abstracted define
 */

// Constructors-Meta, return TMyObject.Create. It's abstracted define.
MetaObject = Function;

// Classes-Meta, return TMyObject. It's abstracted define.
MetaClass = Function;