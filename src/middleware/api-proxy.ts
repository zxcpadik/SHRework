import AwaitEventEmitter from 'await-event-emitter';

export class ApiEvent {
  handle: Boolean = false;
}

export function RegisterMW(func: Function, funcName: string = func.name) {
  return async (...args: any[]) => {
    var retCall = new ApiEvent();
    ApiProxy.emit.emitSync("onCall" + funcName, retCall, ...args);
    if (retCall.handle) return {};
    
    let res = await func(...args);

    var retEnd = { handle: false };
    ApiProxy.emit.emitSync("onEnd" + funcName, retEnd, res);
    if (retEnd.handle) return {};

    return res;
  }
}

export module ApiProxy {
  export const emit = new AwaitEventEmitter();
}