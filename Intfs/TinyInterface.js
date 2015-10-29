/*****************************************************************************
Qomolangma OpenProject v1.0
  [Aimingoo(aiming@gmail.com)]
  [2008.12.31]

This's tiny interface system, without qomo's class/classtype support, but it's
general system for any extend framework or base javascript.
 - Interface Register
 - Interface Query
 - Aggregated Interface
 - Delegated Interface
 - IInterface interface defined
 - Abstract method
*****************************************************************************/

var
  EQueryObjectInvalid = [8081, 'Can\'t query interface with Null object or undefined value.'];
  EInterfaceNotExist = [8082, 'Query interface is not exist.'];
  ECallAbstract = [8083, 'Call Abstract Method.'];
  EInterfaceNotExistOrRegister = [8084, '"%s" is not interface or none registed.'];

/**
 * Abstract method for interfaces
 */
Abstract = function() {
  throw new Error(ECallAbstract)
}

/**
 * Base interfaces for the system
 */
IInterface = function() {
  this.QueryInterface = Abstract;
}


/**
 * Interface keyword
 *
 * Register Interface for functions or Object's instances
 *   Interface(obj, Interfaces);
 *   RegisterInterface(obj, Interfaces);
 *   Interface.RegisterInterface(obj, Interfaces);
 */
Interface = function() {
  var handle = '_INTFHANDLE_';
  var $Intfs = { length:1 };  // skip zero
  var $Deles = [];
  var $Delei = [];

  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i=0, len=this.length; i<len; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }

  function idByName(n, h, confers) {
    // include, result, declude;
    var i, r, d = new Array();
    var confer, NullArray = [];

    function $r(i,d,r) {
      var l = '';
      while (r-- > 0) {
        if (isNaN(i[r]))
          l = i[r];
        else if (!d || (indexOf.apply(d, [i[r]]) == -1))
          return i[r] + l;
        else
          l = '';
      }
    }

    var x = -1;
    while (confer = confers[++x]) {
      d.push.apply(d, (confer['-'][h] && confer['-'][h][n]) || NullArray);
      if ((i = confer['+'][h]) && (i = i[n]) && (r = i.length) && (r = $r(i,d,r)))
        return [x,r];
    }

    var x = -1;
    while (confer = confers[++x]) {
      d = d.concat((confer['-'][h] && confer['-'][h]['-']) || NullArray);
      if ((i = confer['+'][h]) && (i = i['+']) && (r = i.length) && (r = $r(i,d,r)))
        return [x,r];
    }

    var x = -1;
    while (confer = confers[++x]) {
      if ((i = confer['*'][h]) && (i = i['*']) && (r = i.length) && (r = $r(i,d,r)))
        return [x,r];
      if ((i = confer['*']['*']) && (r = i.length) && (r = $r(i,d,r)))
        return [x,r];
    }
  }

  function getConfers(obj) {
    var i = indexOf.apply($Deles, [obj]);
    return (i != -1) && [$Delei[i]];
  }

  function getConfersInstance(obj, confers) {
    var i = $Deles.length, foo = obj.constructor;
    /* support inherited */
    while (i--) if ($Deles[i] instanceof Function && obj instanceof $Deles[i]) confers.push($Delei[i])
    /* without inherited
      if (foo == $Deles[i]) return confers.push($Delei[i]);
    */
  }

  function getConfersWithClass(obj) {
    var confers = getConfers(obj) || [];
    getConfersInstance(obj, confers);
    return (confers.length > 0)  && confers;
  }

  function warpInterface(intf) {
    var h = intf[handle];
    if ((h===undefined) || !$Intfs[h] || $Intfs[h][0]!==intf) {
      h = intf[handle] = $Intfs.length++;
      $Intfs[h] = [intf];
    }
    return $Intfs[h];
  }
  warpInterface(IInterface);

  // return intf defined
  function isInterface(intf) {
    if (intf instanceof Function) {
      var h = intf[handle];
      return (h!==undefined && $Intfs[h] && $Intfs[h][0]===intf);
    }
    return false;
  }

  // return obj is interface's instance
  function isVtbl(obj) {
    return isInterface(obj.constructor);
  }

  var _r_attribute = /^([gs]et)(.+)/;
  var $slot = 'f["$$"] = function()';
  var slot1 = ($slot + '{return obj["$$"].apply(obj, arguments)}').split('$');
  var slot2 = ($slot + '{return obj.$$("$$"$$)}').split('$');
  var slot3 = ($slot + '{var p2=confers[$$]["#"][$$]; return p2["$$"].apply(p2, arguments)}').split('$');
  var slot4 = ($slot + '{var p2=confers[$$]["#"][$$](obj); return p2["$$"].apply(p2, arguments)}').split('$');
  var slot5 = ($slot + '{var p2=confers[$$]["#"][$$](obj); return (!("$$" in p2) && ("$$" in p2) ? p2.$$("$$"$$) : p2.$$.apply(p2, arguments))}').split('$');

  function joinSlot(slot) {  // 1..n
    for (var i=j=1,args=arguments,argn=args.length; i<argn; i++,j++) {
      slot[j++] = args[i];
    }
    return slot.join('');
  }

  function bySelf(n, obj, m) { // dont pass <m>
    return ((!(n in obj) && (m=_r_attribute.exec(n)))
      ? joinSlot(slot2, n, m[1], m[2], (m[1] == 'get' ? '' : ', arguments[0]'))
      : joinSlot(slot1, n, n));
  }

  // proxies = confers[sharp]['#'];
  // proxies[x] is proxy_object.
  function byProxyObj(sharp, x, n, n2) {
    return joinSlot(slot3, n, sharp, x, n2);
  }

  // proxies = confers[sharp]['#'];
  // proxies[x] is proxy_function.
  // name n is src, n2 is dest(or equ n)
  function byProxyFoo(sharp, x, n, n2, m) { // dont pass <m>
    return ((!(m = _r_attribute.exec(n2)))
      ? joinSlot(slot4, n, sharp, x, n2)
      : joinSlot(slot5, n, sharp, x, n2, m[1], m[1], m[2], (m[1] == 'get' ? '' : ', arguments[0]'), n2));
  }

  // IInterface implemented by anything, other for Qomo's class only
  function isImplemented(intf) {
    // default interfaces or deferred load classes
    switch (intf) {
      case IInterface: return true;
      // more ...
    }

    // for normal object or constructor, or registed to cls.Create.
    var all = $Intfs[intf[handle]]
    var i = all.length; // must recessive!
    if (this instanceof Function) { // is normal function or constructor
      while (i--) if (all[i] == this) return true;
    }
    else {
      while (i--) {
        if (this == all[i]) return true;
        if (all[i] instanceof Function && this instanceof all[i]) return true;
      }
    }
    return false;
  }

  function _Interface(obj) { /* Intf1 .. Intfn */
    if (obj===undefined || obj===null) return -1;

    // warp interfaces, and assign to <obj>
    // always register <obj>, for function, object, and anything.
    for (var i=1,args=arguments,argn=args.length; i<argn; i++) {
      var all = warpInterface(args[i]);  // all[0] equ intf
      if (indexOf.apply(all, [obj]) == -1) all.push(obj);
    }

    // register delegated interfacds. is special!
    switch (_Interface.caller) {
      case Delegate: if (this!==Delegate) {
        var consigner=this, confer=obj;
        var i = indexOf.apply($Deles, [consigner]);
        if (i == -1) {
          $Deles.push(consigner);
          $Delei.push(confer);
        }
        else {
          $Delei[i].merge(confer);
        }
      }
    }

    // now, if you want, you can recheck instance's interface
  }

  _Interface.QueryInterface = function(obj, intf) {
    // 1. check arguments
    if (obj===undefined || obj===null) throw new Error(EQueryObjectInvalid);
    if (!isInterface(intf)) throw new Error(EInterfaceNotExist);

    if (typeof obj == 'object') {
      // 2. interface implemented self
      if (obj instanceof intf) return obj;
      // 3. obj is A Interface instance(a vtbl);
      if (isVtbl(obj)) return obj.QueryInterface(intf);
    }

    // 4. return a implemented interface for Object's Registed Interfaces, or A IInterface impl.
    if (intf===IInterface) {
      return ({
        constructor: IInterface,
        QueryInterface: function(f) { return Interface.QueryInterface(obj, f) }
      })
    }

    // 5. not implemented, return undefined
    if (!isImplemented.call(obj, intf)) {
      return void null;
    }

    // 6. make interface methods, point to obj(instance or object or delegated)'s method
    var c = [], f = new intf();
    var confers = (obj instanceof Function ? getConfers : getConfersWithClass)(obj);
    if (confers) { // delegated interfaces
      var proxies, sharp;
      var n2, x, h = intf[handle];
      for (var n in f) {
        if (x = idByName(n, h, confers)) {
          sharp = x[0];
          proxies = confers[sharp]['#'];
          x = x[1];
          n2 = isNaN(x) ? x.match(/\D.*/)[0] : n;
          x = parseInt(x);
          c.push((proxies[x] instanceof Function ? byProxyFoo : byProxyObj)(sharp, x, n, n2));
        }
        else c.push(bySelf(n, obj));
      }
    }
    else { // implemented by obj
      for (var n in f) c.push(bySelf(n, obj))
    }
    eval(c.join('\n'));
    f.QueryInterface = function(intf) { return Interface.QueryInterface(obj, intf) };
    return f;
  }

  _Interface.RegisterInterface = _Interface;
  _Interface.IsInterface = isInterface;
  return _Interface;
}();
RegisterInterface = Interface.RegisterInterface;


/**
 * Interface Query
 *
 * AIntf = QueryInterface(obj, intf);
 */
QueryInterface = Interface.QueryInterface;


/**
 for classes: Delegate(AContructorFuncion, tbl)
 for instance: Delegate(obj, tbl);

 tbl = [
   [obj_or_func1, ['*', '*|+|-Interface', ...]],
   [obj_or_func2, ['+|-Interface.name', ...]],
   [obj_or_func3, ['+Interface.name:methodName', ...]]
 ]
*/
Delegate = function() {
  var handle = '_INTFHANDLE_';
  var _r_rule = /^([\*\+\-]?)([^\.]*)(\.([^\:]*)(\:(.*))?)?/;

  function cnvTbl(tbl) {
    var sharp = this['#'];
    for (var i=0,imax=tbl.length; i<imax; i++) {
      var m, obj = tbl[i][0], rules = tbl[i][1];

      // search obj in sharp, or push it.
      for (var x=1,xmax=sharp.length; x<xmax; x++) {
        if (sharp[x]==obj) break;
      }
      if (x == sharp.length) sharp[sharp.length++] = obj;

      // parse rules
      for (var j=0,jmax=rules.length; j<jmax; j++) {
        if (!(m=rules[j].match(_r_rule))) continue;

        // interface, interface_handle, method_name, alias, data_sign
        var intf = h = n = a = d = undefined;
        switch (d = m[1]||'+') {
        case '*': if (!m[2]) break;
        case '+':
        case '-':
          n = m[4], a = m[6];
          if (!(h = parseInt(m[2]) || ((intf=eval(m[2])) && intf[handle]))) {
            throw new Error(EInterfaceNotExistOrRegister.concat([m[2]]));
          }
        }

        var t = this[d];
        if (n || h) {
          d = n || d;
          h = t[h] || (t[h]={});
          t = h[d] || (h[d]=[]);
        }
        else t = t[d]; // for "*" only

        t.push(x) && a && t.push(a);
      }
    }
  }

  function Tbl(tbl) {
    this['@'] = tbl;
    this['#'] = { length:1 };  // skip zero
    this['*'] = { '*': [] };
    this['+'] = { };
    this['-'] = { };
    cnvTbl.apply(this, arguments);
  }

  Tbl.prototype.merge = function(confer) {
    this['@'] = this['@'].concat(confer['@']);
    cnvTbl.call(this, confer['@']);
  }

  // interface delegation.
  function _Delegate(consigner, confer) {
    Interface.RegisterInterface.call(consigner, new Tbl(confer));
  }
  return _Delegate;
}();


/**
 * Aggregated Interface register (Utility function)
 *
 * Intfs = Aggregate(aFunction, Interfaces);
 */
Aggregate = function() {
  var handle = '_INTFHANDLE_';

  function Interfaces(args, confer) {
    for (var h,i=1; i<args.length; i++) {
      confer.push([this[h=args[i][handle]] = new args[i], [h.toString()]]);
    }
  }

  Interfaces.prototype.GetInterface = function(intf) {
    return this[intf[handle]];
  }

  // interface aggregation.
  function _Aggregate(foo) { /* Intf1 .. Intfn */
    if (foo instanceof Function) {
      Interface.RegisterInterface.apply(_Aggregate, arguments);

      var confer = [], ff = new Interfaces(arguments, confer);
      Delegate(foo, confer);
      return ff;
    }
  }
  return _Aggregate;
}();