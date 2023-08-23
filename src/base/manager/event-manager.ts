import EventEmitter from 'eventemitter3';
import { singleton } from '../decorator/singleton-decorator';

@singleton
export class EventManager {
    private eventEmitter: EventEmitter = new EventEmitter();

    emit(event: string, ...args: any): boolean {
        return this.eventEmitter.emit(event, args);
    }

    on(event: string, fn: (res: any) => void, context?: any): void {
        this.eventEmitter.on(event, fn, context);
    }

    once(event: string, fn: () => void, context?: any): void {
        this.eventEmitter.once(event, fn, context);
    }

    off(event: string, fn: () => void, context?: any): void {
        this.eventEmitter.off(event, fn, context);
    }
}
