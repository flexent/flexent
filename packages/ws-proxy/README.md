# @flexent/ws-proxy

Transparent WebSocket upgrade relay for Node.js HTTP servers.

## Usage

Subclass `WsProxy` and implement `processConnection` to authenticate, open the outbound socket, and specify the upgrade request to send upstream:

```ts
import { connectToUrl, WsProxy, WsProxyContext, WsProxyRelay } from '@flexent/ws-proxy';

class MyProxy extends WsProxy {

    protected async processConnection(ctx: WsProxyContext): Promise<WsProxyRelay> {
        const outbound = await connectToUrl('wss://upstream.example/lease');
        return {
            outbound,
            upgrade: {
                path: '/lease?t=token',
                host: 'upstream.example',
                omitHeaders: ['authorization'],
            },
        };
    }

}
```

Call `onUpgrade` from your HTTP server's `upgrade` event to relay the WebSocket handshake and stream data bidirectionally.
