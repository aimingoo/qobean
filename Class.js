/**
 * QoBean base class architecture
 *  - aClass = new MetaClass();
 *  - aClass.Create = new MetaObject();
 *  - aObject = new aConstructor_RegedByClass; or
 *  - aObject = aClass.Create();
 */

// class register util
function Class(Parent, Name) {
  var Constructor = eval(Name);
  var cls = new MetaClass(Constructor);

  // parent-class link and prototype set.
  Parent && (Constructor.prototype = Parent.Create.prototype);

  // the qomo classes system.
  // Initializtion -->
  ((cls.Create = new MetaObject(cls) // step one, get Create() method, and find class-info from Meta-Class.
   ).prototype = cls(Constructor)    // step two, register classinfo and return a proto-instance. set the instance to cls.Create.prototype
  ).constructor = cls.Create;        // step three, rewrite constructor property.
  // <-- Initialized

  // rewrite constructor by 'Name'
  (Name instanceof Function) || eval(Name + '= cls.Create');
  return cls;
}