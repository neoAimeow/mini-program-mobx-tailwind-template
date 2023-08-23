import { toObject } from '../utils/object';

export interface AppOptions {}

// @ts-ignore
export function app(options: AppOptions) {
    return function (CreateApp: new () => AnyObject) {
        let app = new CreateApp();
        // @ts-ignore
        let obj = toObject(app);
        App(obj);
    };
}
