# @flexent/protocomm-ws

WebSocket handler for serving `@flexent/protocomm` protocols.

## Usage

Extend `WsProtocolHandler` in connection scope and provide a protocol index plus implementation.

```ts
import { type RpcEventEnvelope, type RpcEventSource } from '@flexent/protocomm';
import { WsProtocolHandler } from '@flexent/protocomm-ws';
import { dep } from 'mesh-ioc';

import { appProtocol, type AppProtocol } from './protocol.js';
import { AppProtocolEvents } from './AppProtocolEvents.js';
import { AppProtocolImpl } from './AppProtocolImpl.js';

interface ClientTarget {
    clientId?: string;
    channel?: string;
}

export class AppWsProtocolHandler extends WsProtocolHandler<AppProtocol, ClientTarget> {

    @dep() protected appProtocolImpl!: AppProtocolImpl;
    @dep() protected appProtocolEvents!: AppProtocolEvents;

    get protocol() {
        return appProtocol;
    }

    get protocolImpl() {
        return this.appProtocolImpl;
    }

    protected get eventSource(): RpcEventSource<ClientTarget> {
        return this.appProtocolEvents;
    }

    protected acceptsEvent(envelope: RpcEventEnvelope<ClientTarget>): boolean {
        return !envelope.target || envelope.target.clientId === this.getClientId();
    }

    protected getClientId(): string {
        return 'current-client-id';
    }

}
```

Applications own client identity, channel membership, and multi-process fan-out. The handler only normalizes RPC event envelopes and sends accepted events to the current connection.
