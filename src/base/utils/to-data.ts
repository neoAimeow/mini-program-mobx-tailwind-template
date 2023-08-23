import { toJS } from 'mobx';

export const toData = (source?: any[]): any => {
    if (!source) return;
    const target: AnyObject = {};

    Promise.all(
        source.map(item => {
            if (is.obj(item)) {
                getPropertyNames(item).forEach(key => {
                    target[key] = toJS(item[key]);
                });

                return target;
            }
            return null;
        }),
    );
    return target;
};

export const is = {
    fun: (a: unknown): a is Function => typeof a === 'function',
    arr: (a: unknown): a is [] => Array.isArray(a),
    obj: (a: unknown): a is AnyObject => Object.prototype.toString.call(a) === '[object Object]',
    set: (a: unknown): a is Set<any> => Object.prototype.toString.call(a) === '[object Set]',
    map: (a: unknown): a is Map<any, any> => Object.prototype.toString.call(a) === '[object Map]',
};

const getPropertyNames = (o: AnyObject) => {
    const propertiesInMobx = ['__mobxDidRunLazyInitializers', '$mobx'];
    return Object.getOwnPropertyNames(o).filter(prop => !propertiesInMobx.includes(prop));
};
