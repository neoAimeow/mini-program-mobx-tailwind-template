import { Logger } from '../utils/logger';

export type HandlerFunction = (param: { ctx?: any; args?: any; error?: any }) => void;

export type CatchDecoratorParam = {
    onlyCatch?: boolean;
    // 只在异常出现的时候需要执行的代码（不宜过长）
    exceptionHandler?: HandlerFunction;
    // 函数执行前需要执行的代码（AOP）
    beforeFuncHandler?: HandlerFunction;
    // 函数执行后需要执行的代码(AOP)， 包括异常出现后也会执行。
    afterFuncHandler?: HandlerFunction;
    // 是否打印函数参数（个别场景打印参数会嵌套循环，介时通过beforeFuncHandler去打印）
    needPrintArgs?: boolean;
    // error的基本描述
    errorDescription?: string;
    // 在catch住error的时候，打印完日志，重新将Error抛出。
    needThrow?: boolean;
};

type DoWithError = {
    tag: string;
    propertyKey: string;
    ctx: unknown;
    error: unknown;
    catchParam?: CatchDecoratorParam;
    args: AnyArray;
};

function callFunc(ctx: any, args: any, handler?: HandlerFunction) {
    if (handler && typeof handler === 'function') {
        handler({ ctx, args });
    }
}

function doWithError(params: DoWithError) {
    const { tag, propertyKey, ctx, error, catchParam, args } = params;
    const { exceptionHandler, errorDescription, needThrow = false } = catchParam || {};
    Logger.error(tag, errorDescription || `${propertyKey}_error`, error);
    if (exceptionHandler) {
        if (typeof exceptionHandler === 'function') {
            // 如果触发error，且该句柄为函数，执行handler回调。
            exceptionHandler({ ctx, args, error });
        } else {
            throw error;
        }
    }
    if (needThrow) {
        // 如果需要继续抛出异常，那就继续向外抛
        throw error;
    }
}

function isPromise(result: any): boolean {
    // 通过res是否包含then方法，判断是否为promise
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
        return true;
    }
    return false;
}

export const CatchLog =
    (tag: string, catchParam?: CatchDecoratorParam) =>
    // @ts-ignore
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const { beforeFuncHandler, afterFuncHandler, needPrintArgs = true, onlyCatch = false } = catchParam || {};
        // debugger;
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: unknown[]) {
            try {
                onlyCatch || Logger.info(tag, `${propertyKey} invoked`, needPrintArgs ? args : {});
                callFunc(this, args, beforeFuncHandler);
                const result = originalMethod.apply(this, args);
                if (isPromise(result)) {
                    // 在执行exceptionHandler后，不执行afterFuncHandler
                    let hasError = false;
                    return (result as Promise<unknown>)
                        .catch((error: unknown) => {
                            hasError = true;
                            doWithError({ tag, propertyKey, ctx: this, error, catchParam, args });
                        })
                        .finally(() => {
                            hasError || callFunc(this, args, afterFuncHandler);
                        });
                } else {
                    callFunc(this, args, afterFuncHandler);
                }
                return result;
            } catch (error: unknown) {
                doWithError({ tag, propertyKey, ctx: this, error, catchParam, args });
            }
        };
        return descriptor;
    };
