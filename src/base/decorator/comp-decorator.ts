import { autorun, IReactionDisposer } from 'mobx';
import { mixin } from '../utils/mixin';
import { toObject } from '../utils/object';
import { toData } from '../utils/to-data';
import diff from '../utils/diff';

type TComponent = WechatMiniprogram.Component.Options<
    WechatMiniprogram.Component.DataOption,
    WechatMiniprogram.Component.PropertyOption,
    WechatMiniprogram.Component.MethodOption
> & { [key: string]: any };

export interface CompOptions {
    mixins?: TComponent[];
    observedStores?: AnyObject[];
}

enum CompMethodType {
    Methods,
    Life_Times,
    Page_Life_Times,
    Observers,
}

interface CompMethod {
    name: string;
    compName: string;
    methodName: string;
}

const compMethodMap: Map<CompMethodType, CompMethod[]> = new Map();

export interface BaseComponent<TData extends WechatMiniprogram.Component.DataOption>
    extends WechatMiniprogram.Component.Data<TData>,
        WechatMiniprogram.Component.Lifetimes,
        WechatMiniprogram.Component.InstanceProperties,
        WechatMiniprogram.Component.OtherOption,
        WechatMiniprogram.Component.InstanceMethods<TData> {}

export class BaseComponent<TData> {
    // readonly data: Readonly<TData> = {} as TData;
}
/**
 * 将一个继承了 BaseComponent 的类转化成 小程序 Component 的调用
 */
export function component(options: CompOptions = {}) {
    return function (CreateComponent: new () => BaseComponent<WechatMiniprogram.IAnyObject>) {
        if (!options.mixins) options.mixins = [];
        let dispose: IReactionDisposer;

        const observedStores = options.observedStores;
        options.mixins.push({
            attached() {
                if (observedStores) {
                    dispose = autorun(() => {
                        const diffs: AnyObject = diff({ ...this.data, ...toData(observedStores) }, this.data);
                        this.setData(diffs);
                    });
                }
            },
            detached() {
                if (dispose) dispose();
            },
        });

        let obj: TComponent = toObject(new CreateComponent());

        if (options.mixins && options.mixins.length) {
            mixin(obj, options.mixins);
        }
        const compMethods = compMethodMap.get(CompMethodType.Methods) || [];
        const methods: WechatMiniprogram.Component.MethodOption = {};

        compMethods.map(item => {
            const { compName, methodName } = item;
            if (compName === CreateComponent.name) {
                const func = obj[methodName];
                if (func instanceof Function) {
                    methods[methodName] = func;
                }
            }
        });

        const pltMethods: { [key: string]: any } = {};
        const pltCacheMethods = compMethodMap.get(CompMethodType.Page_Life_Times) || [];

        pltCacheMethods.map(item => {
            const { compName, methodName, name } = item;
            if (compName === CreateComponent.name) {
                const func = obj[methodName];
                if (func instanceof Function) {
                    pltMethods[name] = func;
                }
            }
        });

        const observeMethods: { [key: string]: any } = {};
        const observeCacheMethods = compMethodMap.get(CompMethodType.Observers) || [];

        observeCacheMethods.map(item => {
            const { compName, methodName, name } = item;
            if (compName === CreateComponent.name) {
                const func = obj[methodName];
                if (func instanceof Function) {
                    observeMethods[name] = func;
                }
            }
        });
        // @ts-ignore

        obj.methods = methods;
        obj.pageLifetimes = pltMethods;
        obj.observers = observeMethods;

        Component(obj);
    };
}

export const method = () => (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    // 用类名去重，记录当前函数名至Map，以便component的decorator来区分是否是事件方法，以便并入methods
    const arr: CompMethod[] = compMethodMap.get(CompMethodType.Methods) || [];
    const className = target.constructor.name || 'defaultClass';
    arr.push({ name: propertyKey, compName: className, methodName: propertyKey });
    compMethodMap.set(CompMethodType.Methods, arr);
    return descriptor;
};

export const observe =
    (param?: { propertyName?: string }) => (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
        // 用类名去重，记录当前函数名至Map，以便component的decorator来区分是否是事件方法，以便并入methods
        const { propertyName = propertyKey } = param || {};
        const arr: CompMethod[] = compMethodMap.get(CompMethodType.Observers) || [];
        const className = target.constructor.name || 'defaultClass';
        arr.push({ name: propertyName, compName: className, methodName: propertyKey });
        compMethodMap.set(CompMethodType.Observers, arr);
        return descriptor;
    };

export const pageLifeTimes =
    (param?: { pageLifeName?: string }) => (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
        const { pageLifeName = propertyKey } = param || {};
        const pageLifeArr = ['show', 'hide', 'resize', 'routeDone'];
        const hasValue = pageLifeArr.some(res => res === pageLifeName);

        if (!hasValue) {
            console.error('pageLifeTime error;', 'pageLifeTimes命名不正确。该函数无效。', {
                className: target.constructor.name,
                methodName: propertyKey,
            });
            return;
        }

        const arr: CompMethod[] = compMethodMap.get(CompMethodType.Page_Life_Times) || [];
        const className = target.constructor.name || 'defaultClass';
        arr.push({ name: pageLifeName, compName: className, methodName: propertyKey });
        compMethodMap.set(CompMethodType.Page_Life_Times, arr);
        return descriptor;
    };
