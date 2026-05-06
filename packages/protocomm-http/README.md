# @flexent/protocomm-http

HTTP handler for serving `@flexent/protocomm` protocols through `@flexent/http-server`.

## Usage

Extend `HttpProtocolHandler` in request scope and provide a protocol index plus implementation.

```ts
import { HttpProtocolHandler } from '@flexent/protocomm-http';
import { dep } from 'mesh-ioc';

import { appProtocol, type AppProtocol } from './protocol.js';
import { AppProtocolImpl } from './AppProtocolImpl.js';

export class AppHttpProtocolHandler extends HttpProtocolHandler<AppProtocol> {

    @dep() protected appProtocolImpl!: AppProtocolImpl;

    prefix = '/rpc';

    get protocol() {
        return appProtocol;
    }

    get protocolImpl() {
        return this.appProtocolImpl;
    }

}
```

Query methods are served with `GET`. Command methods are served with `POST`.
