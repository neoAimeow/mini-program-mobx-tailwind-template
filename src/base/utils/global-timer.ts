import { singleton } from '../decorator/singleton-decorator';

type TimerHandlerFunction = (param: {}) => void;
type TimerStruct = {
    uniqueKey: string;
    func: TimerHandlerFunction;
};
@singleton
export class GlobalTime {
    private timeRef?: number;
    private queue: TimerStruct[] = [];

    constructor() {
        this.startTimeout();
    }

    // 当列表cell使用的时候，uniqueKey必须要加index或其它值保证唯一
    public addTarget(param: { uniqueKey: string; func: TimerHandlerFunction }): void {
        this.startTimeout();
        const { uniqueKey, func } = param;
        let hasInQueue = false;
        this.queue.map((item: TimerStruct) => {
            const { uniqueKey: key } = item;
            if (key === uniqueKey) {
                hasInQueue = true;
            }
        });
        if (hasInQueue) {
            this.removeTarget(uniqueKey);
            // throw new Error('已经存在了一个key，不要重复添加');
        }
        this.queue.push({ uniqueKey: uniqueKey, func: func });
    }

    public removeTarget(uniqueKey: string): void {
        let index = -1;
        Promise.all(
            this.queue.map((item, idx) => {
                const { uniqueKey: key } = item;
                if (key === uniqueKey) {
                    index = idx;
                }
            }),
        );
        if (index >= 0) {
            this.queue.splice(index, 1);
        }
    }

    private startTimeout(): number {
        if (!this.timeRef) {
            this.timeRef = setInterval(() => {
                this.queue.map(item => {
                    const { func } = item;
                    if (typeof func === 'function') {
                        func({});
                    }
                });
            }, 1000);
        }
        return this.timeRef;
    }
}
