declare module 'phoenix' {
  export class Socket {
    constructor(endPoint: string, opts?: any);
    connect(): void;
    disconnect(callback?: () => void, code?: number, reason?: string): void;
    channel(topic: string, chanParams?: object): Channel;
    onOpen(callback: () => void): void;
    onClose(callback: () => void): void;
    onError(callback: (error: any) => void): void;
  }

  export class Channel {
    join(timeout?: number): Push;
    leave(timeout?: number): Push;
    on(event: string, callback: (response: any) => void): number;
    off(event: string, ref?: number): void;
    push(event: string, payload: object, timeout?: number): Push;
    onClose(callback: () => void): void;
    onError(callback: (reason: any) => void): void;
  }

  export class Push {
    receive(status: string, callback: (response: any) => void): Push;
  }
}
