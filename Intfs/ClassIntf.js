/**
 * Qomo's Class with interface
 * - 2008.06.18
 *
 * - support IClassRegister and IJoPoints for Class()
 * - support IJoPoints, IObject, IAttrProvider, IAttributes for cls.Create
 * - support IJoPoints, IClass, IAttributes for cls
 * - support Class(parent, name, Ixxxx, Iyyyy, ...)
 * - [TODO] IJoPoints for cls.Create and cls
 */

Class = function(OldClass, atom) {
  var all = [];
  var pts = new JoPoints();
  pts.add('Initializtion');
  pts.add('Initialized');

  // Object(8).js
  var $cc_attr = {
    'r': function(p,n) { p['get'+n] !== this.getInvalid },
    'w': function(p,n) { p['set'+n] !== this.setInvalid },
    '*': function(p,n) { p['get'+n] !== this.getInvalid && p['set'+n] !== this.setInvalid },
    'undefined': function() { return true }
  };
  Attribute($cc_attr, 'Invalid', '', '');  // fake and get method_ptr: cantRead(), cantWrite()
  function Proxy(cls) {
    this.all = {}
    this.cls = cls;
    this.Attr = cls(atom).attr;

    var N, Q = $cc_attr;
    with (this) for (N in Attr) {
      if (Attr[N] instanceof Function) continue;
      all[length++] = all[N] = {
        name: N,
        tags: Q['*'](Attr, N) ? 'rw':
              Q['r'](Attr, N) ? 'r' :
              Q['w'](Attr, N) ? 'w' : ''
      }
    }
  }
  Proxy.prototype = {
    length: 0,
    // for IObject
    hasEvent: function(n) { return _r_event.test(n) && (n in this.cls) },
    hasProperty: function(n) { return n in this.cls },
    hasOwnProperty: function(n) { return {}.hasOwnProperty.apply(this.cls, arguments) },
    // for IObject, IClass, IAttrProvider
    hasAttribute: function(n, t) { return (n in this.Attr && $cc_attr[t](this.Attr, n)) },
    hasOwnAttribute: function(n, t) { return (this.Attr.hasOwnProperty(n) && $cc_attr[t](this.Attr, n)) },
    // for IAttributes
    getLength: function() { return this.length },
    items: function(i) { if (!isNaN(i)) return this.all[i] },
    names: function(n) { if (this.all.hasOwnProperty(n)) return this.all[n] }
  }

  // Warp interfaces, can delegate these interfaces in class init.
  function _ClassInit(Parent, Name) {
    if (arguments.length > 2) Interface.WarpInterfaces.apply(null, Array.prototype.slice.call(arguments, 2));
  }

  function _ClassInited(Parent, Name) {
    // register interfaces for <this cls>'s all instnaces
    // Object(1).js
    if (arguments.length > 2) {
      Interface.RegisterInterface.apply(null, [this.Create].concat(
        Array.prototype.slice.call(arguments, 2)
      ))
    }

    // proxy object
    var proxy = new Proxy(this) // <this> is a cls-instance

    // Object(2).js
    // Object(3).js
    // Object(7).js
    //  - registed for root only.
    if (!Parent) {
      Interface.RegisterInterface(this.Create, IAttributer);
      Interface.RegisterInterface(this.Create, IJoPoints, IObject, IAttrProvider, IAttributes);
      Interface.RegisterInterface(this, IJoPoints, IClass, IAttributes);
    }
    Delegate(this.Create, [
      // TODO: [proxy_pts, ['IJoPoints']],
      [proxy, ['IObject', 'IAttrProvider', 'IAttributes']]
    ]);
    Delegate(this, [
      // TODO: [proxy_pts, ['IJoPoints']],
      [proxy, ['IClass', 'IAttributes']]
    ]);

    return all[all.length] = this;
  }

  // The real Class()
  var Init = pts.weaving('Initializtion', _ClassInit);
  var Inited = pts.weaving('Initialized', _ClassInited);
  function _Class(Parent, Name) {
    Init.apply(this, arguments);
    return Inited.apply(OldClass.apply(this, arguments), arguments);
  }

  // Object(4).js
  //  - ths <_proxy> for Class() only.
  var _proxy = {
    // for IClassRegister
    hasClass: function(cls) { return all.indexOf(cls) != -1 },
    // hasClass: function(n) { return !!(n.indexOf('.')>-1 ? eval(n) : _classinfo_[n]) }
    // for IJoPoints
    getLength: function() { return pts.length },
    items: function(i) { return pts.items(i) },
    names: function(n) { if (!isNaN(n)) return pts[n] }
  }

  // register and delegate interfaces
  Interface.RegisterInterface(_Class, IJoPoints, IClassRegister);
  Delegate(_Class, [
   [_proxy, ['IClassRegister', 'IJoPoints']]
  ]);

  return _Class;
}(Class, TObject);