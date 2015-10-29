/**
 * qomo system defined interfaces
 */

IImport = function() {
  /* ... */
}

// Collection or named Enumerator
INamedEnumer = function() {
  this.getLength =
  this.items =
  this.names = Abstract;
}

// for TMyObject(), etc.
IClass = function() {
  this.hasAttribute =
  this.hasOwnAttribute = Abstract;
}

// for Custom Attribute provide object
IAttrProvider = function() {
  this.hasAttribute =
  this.hasOwnAttribute = Abstract;
}

// for Attribute's getter/setter
IAttributer = function() {
  this.get =
  this.set = Abstract;
}

// for Attribute's Collection
IAttributes = function() {
  INamedEnumer.call(this);
}

// for instance by TMyObject, etc.
IObject = function() {
  IAttrProvider.call(this);

  this.hasEvent =
  this.hasProperty =
  this.hasOwnProperty = Abstract;
/* can't detect:
   this.hasOwnEvent = Abstract; */
}

// for Class() function
IClassRegister = function() {
  this.hasClass = Abstract;
}

// for TAspect and all sub-classes
IAspect = function() {
  this.supported =
  this.assign =
  this.unassign =
  this.merge =
  this.unmerge =
  this.combine =
  this.uncombine =
  this.OnIntroduction =
  this.OnBefore =
  this.OnAfter =
  this.OnAround = Abstract;
}

// (inherted or united) define interfaces
IAspectedClass = function() {
  IClass.call(this);
  IJoPoints.call(this);
}