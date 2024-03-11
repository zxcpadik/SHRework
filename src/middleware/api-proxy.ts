import AwaitEventEmitter from "await-event-emitter";

export class ApiEvent {
  handle: Boolean = false;
  reason: number = -1;
  reject: Boolean = false;
}

export function RegisterMW(func: Function, funcName: string = func.name) {
  return async (...args: any[]) => {
    var retCall = new ApiEvent();
    ApiProxy.emit.emitSync("call" + funcName, retCall, ...args);
    if (retCall.handle) return {};

    let res = await func(...args);

    var retEnd: ApiEvent = new ApiEvent();
    ApiProxy.emit.emitSync("end" + funcName, retEnd, res);
    if (retEnd.reject) return;
    if (retEnd.handle)
      return { ok: false, status: retEnd.reason <= 0 ? 450 : retEnd.reason };
    return res;
  };
}

export module ApiProxy {
  export const emit = new AwaitEventEmitter();
}
