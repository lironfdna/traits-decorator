
const _REF_ = Symbol();
const _COCKTAIL_REQUIRED_NAME_ = '$$required$$';

function _filterKeys(key) {
    return !key.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length|__esModule)$/);
}

function _isRequiredMethod(target, methodName) {
    let method = target[methodName];
    return method && method.name === _COCKTAIL_REQUIRED_NAME_;
}

function _raiseErrorIfConflict(methodName, traitProto, subjectProto) {
    let subjectMethod = subjectProto[methodName],
        traitMethod = traitProto[methodName],
        sameMethodName = (subjectMethod && traitMethod),
        methodsAreNotTheSame = sameMethodName && (subjectMethod.toString() !== traitMethod.toString()),
        traitMethodIsNotARequired = sameMethodName && !_isRequiredMethod(traitProto, methodName),
        subjecMethodIsNotARequired = sameMethodName && !_isRequiredMethod(subjectProto, methodName);

    if ( sameMethodName && methodsAreNotTheSame && traitMethodIsNotARequired && subjecMethodIsNotARequired) {
        throw new Error('Method named: ' + methodName + ' is defined twice.' );
    }
}

function _raiseErrorIfItIsState(key, traitProto) {
    if (typeof traitProto[key] !== 'function') {
        throw new Error('Trait MUST NOT contain any state. Found: ' + key + ' as state while processing trait');
    }
}

function _applyIfNotExcluded(method, traitProto, subject, aliases, excluded) {

    if (excluded.indexOf(method) === -1) {
        let _alias = aliases[method] || method;

        _raiseErrorIfConflict(_alias, traitProto, subject);

        if (!subject[_alias] || _isRequiredMethod(subject, _alias)) {
            Object.defineProperty(subject, _alias, Object.getOwnPropertyDescriptor(traitProto, method));
        }
    }

}

function _applyMethod(method, traitProto, subject, aliases, excluded) {
    _applyIfNotExcluded(method, traitProto, subject, aliases, excluded);
}

// trait or trait descriptor

function _reference() {
    return this[_REF_] || this;
}

function _aliases() {
    return this.alias || {};
}

function _excludes() {
    return this.excludes || [];
}
// --

function _apply(t) {
    let subject  = this,
        aliases  = t::_aliases(),
        excluded = t::_excludes(),
        ref      = t::_reference(),
        tp       = ref.prototype || ref;

    Object.getOwnPropertyNames(tp)
        .filter(_filterKeys)
        .forEach(function(method) {
            _raiseErrorIfItIsState(method, tp);
            _applyMethod(method, tp, subject, aliases, excluded);
        });
}

function _addTrait(t) {
    let subject = this.prototype;
    subject::_apply(t);
}

function _asDescriptor() {
    return (this.prototype || !this[_REF_] ? {[_REF_]: this} : this);
}


// PUBLIC API -----------------------------------

// decorators

/**
 * @decorator traits
 * Applies all traits as part of the target class.
 * @params Trait1, ...TraitN {Class|Object}
 * @usage
 *
 *    @traits(TExample) class MyClass {}
 *
 */
export function traits(...traitList) {
    return function (target) {
        traitList.forEach(function(trait){
            target::_addTrait(trait);
        });
    };
}

/**
 * @decorator requires
 * Does Nothing.
 * It's intended to describe / document what methods or properties should be provided by the host class.
 * @params Description1, ...DescriptionN {String}
 * @usage
 *
 * class TPrintCollection {
 *
 *     @requires('collection')
 *     printCollection() {
 *         console.log(this.collection)
 *     }
 * }
 *
 */
export function requires() {
    return function (target, name, descriptor) {  /*do nothing*/ };
}


// bindings

/**
 * @binding excludes
 * Excludes the list of methods from the Trait. This is intended to be used within @traits decorator.
 * @params MethodName1, ...MethodNameN {String}
 * @usage
 *
 * @traits(TExample::excludes('methodOne', 'menthodTwo')) class MyClass {}
 *
 */
export function excludes(...excludesList) {
    let descriptor = this::_asDescriptor();

    descriptor.excludes = excludesList;

    return descriptor;
}

/**
 * @binding alias
 * Alias the methods defined as key from the Trait as value. This is intended to be used within @traits decorator.
 * @params alias {Object}
 * @usage
 *
 * @traits(TExample::alias({'methodOne': 'parentMethodOne'})) class MyClass {}
 *
 */
export function alias(aliases = {}) {
    let descriptor = this::_asDescriptor();

    descriptor.alias = aliases;

    return descriptor;
}

/**
 * @binding as
 * Shortcut for excludes and alias. This is intended to be used within @traits decorator.
 * @params options {Object}
 * @oarams options.alias {Object}
 * @params options.exludes {String[]}
 * @usage
 *
 * @traits( TExample::as({ alias: {'methodOne': 'parentMethodOne'}, excludes: ['methodTwo'] }) ) class MyClass {}
 *
 */
export function as(options = {alias: {}, excludes: []}) {
    let descriptor = this::_asDescriptor(),
        { alias: _alias, excludes: _excludesList } = options;

    descriptor
        ::alias(_alias)
        ::excludes(..._excludesList);

    return descriptor;
}
