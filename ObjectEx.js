/**
 * Qomo's Object ext
 * - 2008.01.07
 */

var
  EInvalidInherited = [8107, 'Inherited method name invalid or none inherited.'];
  EWriteUndefinedAttr = [8110, 'Try write attribute [%s], but its undefined!'];
  EAttributeCantRead = [8113, 'The "%s" attribute can\'t read for %s.'];
  EAttributeCantWrite = [8114, 'The "%s" attribute can\'t write for %s.'];

var
  _r_event = /^On.+/;
  _r_attribute = /^([gs]et)(.+)/;

var
  TObject = Attribute = _get = _set = Atom();


CustomArguments = function() {
  this.result = Array.prototype.slice.call(arguments, 0)
}

MetaClass = Meta(function(atom){
  // root prototype for attributes
/* why?!
  var ATTR = {
    'get': function(n) { return this['get'+n] ? this['get'+n](n) : this[n] },
    'set': function(n, v) { this['set'+n] ? this['set'+n](v,n) : this[n]=v }
  }
*/
  var ATTR = {
    'get': function(n) { return this[n] },
    'set': function(n, v) { this[n] = v }
  }

  function $inherited_invalid() {
    throw new Error(EInvalidInherited)
  }

  function getPropertyName(p, obj) {
    for (var n in obj) if (obj[n]===p) return n
  }

  function inheritedAttribute(foo, cls) {
    var p = cls(atom).attr;
    var n = getPropertyName(foo, p);
    if (n === undefined) return;

    // isn't TObject, and ignore instance's method
    var v = [];
    do {
      if (p.hasOwnProperty(n)) v.push(p[n]);
    }
    while ((cls = cls.ClassParent) && (p = cls(atom).attr));

    if (v[0] !== foo) v.unshift(foo);
    return v;
  }

  function getInheritedMap(method) {
    // is Attribute getter/setter?
    var cls = this.ClassInfo;
    var a = inheritedAttribute(method, cls);
    if (!a) {
      // initialization first map node
      var p, n, a=[method];
      var isSelf = getInheritedMap.caller.caller.caller === method;
      if (n = getPropertyName(method, this)) {
        // check method re-write in object-constructor section
        if (method === cls.Create.prototype[n]) a.pop();
        // check call by same-name method
        if (!isSelf) a.push(method);
        // create inherited stack
        while (cls) {
          p = cls.Create.prototype;
          if (p.hasOwnProperty(n)) a.push(p[n]);
          cls = cls.ClassParent;
        }
      }
    }
    a.push($inherited_invalid);
    return a;
  }

  // call from line:
  //   cls = new MetaClass(Constructor);
  return function(fromConstructor) {
    var Parent = arguments.callee.caller.arguments[0];  // <-- Class(Parent, Name);
    var MAP = [];
    var CDB = {
      attr: Parent ? Unique(Parent(atom).attr) : ATTR,
      events: [],
      map: function(method) {
        if (!(method instanceof Function)) return [method, $inherited_invalid];
        for (var i=0, len=MAP.length; i<len; i++) if (MAP[i][0] === method) return MAP[i];
        return (MAP[len] = getInheritedMap.call(this, method)); // 'this' is a instance of the class
      }
    }

    // call once at class register, from line:
    //   Constructor = cls(Constructor)
    function cls(Base) {
      // call once at sub-class register, from line:
      //   Parent(atom)
      if (Base===atom) return CDB;

      var base = new Base(); // <-- it's class init by user-Constructor/Class.
      var attr = CDB.attr, events = CDB.events;
      for (var i in base) {
        if (base[i] instanceof Function) {
          if (_r_event.test(i)) events.push(i);
          if (_r_attribute.exec(i)) {
            attr[i] = base[i];
            delete base[i];
            if (!(RegExp.$2 in attr)) attr[RegExp.$2] = undefined;
          }
        }
      }

      base.ClassInfo = arguments.callee;
      return base;
    }

    cls.ClassParent = Parent;
    return cls;
  }
}(Attribute), MetaClass);


MetaObject = Meta(function(atom){
  // Instance Data Block
  function IDB($map) {
    var data = this;   // prototype from class's attr
    var cache = []; // un-threadsafe in aInstance(DataBlock) methods

    this.get = function (n) {
      if (arguments.length==0) {
        var args = this.get.caller.arguments;
        n = args.length == 1 ? args[0] : args[1];
        // if (this.get.caller!==data[(args.length==1 ? 'get':'set') + n]) return;
      }
      else {
        var f = data['get'+n];
        if (f) return f.call(this, n);
      }
      return data[n];
    }

    this.set = function(n, v) {
      if (arguments.length==1) {
        var args = this.set.caller.arguments;
        v = n, n = args.length == 1 ? args[0] : args[1];
        // if (this.set.caller!==data[(args.length==1 ? 'get':'set') + n]) return;
      }
      else {
        var f = data['set'+n];
        if (f) return f.call(this, v, n);
      }
      if (n in data) return void(data[n] = v);
      throw new Error(EWriteUndefinedAttr.concat(n));
    }

    this.inherited = function(method) {
      var f=this.inherited.caller, args=f.arguments;

      // arguments analyz
      if (method) {
        if (typeof method=='string' || method instanceof String) f=this[method];
        else if (method instanceof Function) f=method;
        else f=null;
        if (arguments.length > 1) {
          args = (arguments[1] instanceof CustomArguments) ? arguments[1].result
            : Array.prototype.slice.call(arguments, 1);
        }
      }
      if (!f) $inherited_invalid();

      // find f() in cache, and get inherited method p()
      for (var p, i=0; i<cache.length; i++) {
        if (f === cache[i][0]) {
          p = cache[i];
          p.shift();
          return p[0].apply(this, args);
        }
      }

      // if can't find in cache, call $map(), get a inherited tree and push to cache's top.
      var p = cache.push($map.call(this, f).slice(1)) - 1;
      // begin call inherited. at after, we will delete it from cache.
      try {
        return cache[p][0].apply(this, args);
      }
      finally {
        cache.splice(p,1)
      }
    }
  }

  // call from line:
  //   cls.Create = new MetaObject(cls)
  return function(fromClass) {
    // cls for the instance, call once.
    fromClass = fromClass(atom);

    // return to cls.Create = ...
    return function() {
/* TODO: syntax: call orgaign-class as a function
      if (this === window) { ... };
*/
      // syntax: obj = TMyObject.Create();
      if (this instanceof Function) return new arguments.callee(atom, arguments);
      // 1. copy get/set/inherited from IDB
      with (IDB.prototype = fromClass.attr, new IDB(fromClass.map)) this.inherited=inherited, this.get=get, this.set=set;
      // 2. create event handles
      for (var i=0, all=fromClass.events, imax=all.length; i<imax; i++) this[all[i]] = new MuEvent();
      // 3. call this.Create for the instance
      if (this.Create) this.Create.apply(this, arguments[0]===atom ? arguments[1] : arguments);
    }
  }
}(Attribute), MetaObject);

/**
 * Utility Functions _get(), _set(), _cls(), Attribute()
 * - need call in class register and init
 */
_cls = function() { return _cls.caller.caller }

_get = function(atom) {
  return function(n) { return _get.caller.caller(atom).attr.get(n) }
}(_get);

_set = function(atom) {
  return function(n, v) { _set.caller.caller(atom).attr.set(n, v) }
}(_set);

Attribute = function(atom) {
  function cantRead(n) { throw new Error(EAttributeCantRead.concat([n, this.ClassInfo.ClassName])) }
  function cantWrite(v, n) { throw new Error(EAttributeCantWrite.concat([n, this.ClassInfo.ClassName])) }

  return function(base, name, value, tag) {
    if (arguments.length > 3) {
      tag = tag.toLowerCase();
      base['get'+name] = cantRead;
      base['set'+name] = cantWrite;
      for (var i=0; i<tag.length; i++) {
        switch (tag.charAt(i)) {
          case 'p': delete base['set'+name]; // 'p' supported in qomo v2 only
          case 'r': delete base['get'+name]; break;
          case 'w': delete base['set'+name]; break;
        }
      }
    }
    var c = arguments.callee.caller;
    var attr = (c = c && c.caller) && (c = c(atom)) && c.attr;
    attr && attr.set && attr.set(name, value);
  }
}(Attribute);