/**
 * Namespace uses (and register) util
 * Qomo's root space registed
 */

function uses(space) {
  // return a function provide to a NameSpace.toString()
  function $name(name) {
    return new Function("return '" + name + "'");
  }
  // expand namespace
  function $mapx(s) {
    var $spc='', s=s.split('.')
    for (var i=0; i<s.length; i++,$spc+='.') {
      if (eval($spc += s[i])) continue;
      while (true) {
        window.execScript($spc+'={};', 'JavaScript');
        eval($spc).toString = $name($spc);
        if (++i >= s.length) return eval($spc);
        $spc += '.'+s[i];
      }
    }
  }
  // <space> is string or spacename
  try {
    arguments.callee.activeSpace = eval(space) || $mapx(space);
  }
  catch (e) {
    arguments.callee.activeSpace = $mapx(space);
  }
}

// rewrite Class()
Class = function(func, uses) {
  var idx = 0;
  return function(Parent, Name) {
    var cls = func.apply(this, arguments);
    cls.ClassName = 'T' + (Name instanceof Function ? 'Anonymous'+(++idx) : Name);
    cls.SpaceName = uses.activeSpace.toString();
    return uses.activeSpace[cls.ClassName] = cls;
  }
}(Class, uses);

// patch in ff
window.execScript || (window.execScript = new Function('window.eval(arguments[0])'));

// RootSpace is Qomo
Qomo = {};
uses('Qomo.Thirdparty');