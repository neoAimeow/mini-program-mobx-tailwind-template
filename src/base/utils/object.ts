export function getPrototypeOf(obj: any): any {
    return Object.getPrototypeOf ? Object.getPrototypeOf(obj) : obj.__proto__
}

export function iterateInheritedPrototype(
    callback: (proto: Object) => boolean | void,
    fromCtor: any,
    toCtor: any,
    includeToCtor = true,
) {
    let proto = fromCtor.prototype || fromCtor
    let toProto = toCtor.prototype || toCtor

    while (proto) {
        if (!includeToCtor && proto === toProto) break
        if (callback(proto) === false) break
        if (proto === toProto) break
        proto = getPrototypeOf(proto)
    }
}

export interface IClassInstanceToObjectOptions {
    bindTo?: any
    excludes?: string[]
    till?: any
    enumerable?: 0 | boolean
    configurable?: 0 | boolean
    writable?: 0 | boolean
}

export function toObject(something: any, options: IClassInstanceToObjectOptions = {}): { [key: string]: any } {
    let obj = {}
    if (!isObject(something)) return obj

    let excludes = options.excludes || ['constructor']
    let { enumerable = true, configurable = 0, writable = 0 } = options
    let defaultDesc: PropertyDescriptor = {}
    if (enumerable !== 0) defaultDesc.enumerable = enumerable
    if (configurable !== 0) defaultDesc.configurable = configurable
    if (writable !== 0) defaultDesc.writable = writable

    iterateInheritedPrototype(
        proto => {
            Object.getOwnPropertyNames(proto).forEach(key => {
                if (excludes.indexOf(key) >= 0) return
                if (obj.hasOwnProperty(key)) return
                let desc = Object.getOwnPropertyDescriptor(proto, key) as PropertyDescriptor

                let fnKeys = ['get', 'set', 'value'] as Array<'get'>
                fnKeys.forEach(k => {
                    if (typeof desc[k] === 'function') {
                        let oldFn = desc[k] as any
                        desc[k] = function (...args: any[]) {
                            return oldFn.apply(options.hasOwnProperty('bindTo') ? options.bindTo : this, args)
                        }
                    }
                })
                Object.defineProperty(obj, key, { ...desc, ...defaultDesc })
            })
        },
        something,
        options.till || Object,
        false,
    )

    return obj
}

export function isObject(something: any) {
    let type = typeof something
    return something !== null && (type === 'function' || type === 'object')
}

export function isPlainObject(something: any) {
    return Object.prototype.toString.call(something) === '[object Object]'
}
