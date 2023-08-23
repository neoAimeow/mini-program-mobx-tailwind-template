import { autorun, IReactionDisposer } from 'mobx';
import { mixin } from '../utils/mixin';
import { toObject } from '../utils/object';
import diff from '../utils/diff';
import { toData } from '../utils/to-data';

type PageOption = WechatMiniprogram.Page.Options<
    WechatMiniprogram.Page.DataOption,
    WechatMiniprogram.Page.CustomOption
>;

export interface PageOptions {
    /** 指定要注入的 mixin */
    mixins?: PageOption[];
    observedStores?: AnyObject[];
}

export interface BasePage<TData extends WechatMiniprogram.Page.DataOption>
    extends WechatMiniprogram.Page.Data<TData>,
        WechatMiniprogram.Page.ILifetime,
        WechatMiniprogram.Page.InstanceProperties,
        WechatMiniprogram.Page.InstanceMethods<TData> {}

export class BasePage<TData> {
    readonly data: Readonly<TData> = {} as TData;
}

let diffs: AnyObject | undefined = undefined;

export type PageQuery = Record<string, string | undefined>;

export function page(options: PageOptions = {}) {
    return function (CreatePage: new () => BasePage<WechatMiniprogram.IAnyObject>) {
        if (!options.mixins) options.mixins = [];
        let dispose: IReactionDisposer;

        let obj: PageOption = toObject(new CreatePage());
        const observedStores = options.observedStores;
        options.mixins.push({
            onLoad() {
                dispose = autorun(() => {
                    diffs = diff({ ...this.data, ...toData(observedStores) }, this.data);
                    this.setData(diffs);
                });
            },
            onUnload() {
                if (dispose) dispose();
            },
            onShareAppMessage() {
                const path = '';
                console.info('share path:', path);
                const shareObj = {
                    title: '',
                    path: path,
                    imageUrl: '',
                };
                return shareObj;
            },
            onShareTimeline() {
                return {
                    title: '',
                };
            },
        });

        if (options.mixins && options.mixins.length) {
            mixin(obj, options.mixins);
        }

        Page(obj);
    };
}
