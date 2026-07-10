# @flexent/ws-proxy

Transparent WebSocket upgrade relay for Node.js HTTP servers.

## Usage

Subclass `WsProxy` and implement outbound connection handling:

```ts
import { Duplex } from 'node:stream';
import { WsProxy, WsProxyContext } from '@flexent/ws-proxy';

class MyProxy extends WsProxy {

    protected override async processConnection(_ctx: WsProxyContext): Promise<void> {}

    protected override async connectOutbound(_ctx: WsProxyContext): Promise<Duplex> {
        // Return a TCP socket or other Duplex connected to the upstream server.
        throw new Error('Not implemented');
    }

}
```

Call `onUpgrade` from your HTTP server's `upgrade` event to relay the WebSocket handshake and stream data bidirectionally.
