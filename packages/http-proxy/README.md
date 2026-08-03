# @flexent/http-proxy

Modular components for building HTTP/HTTPS proxies.

Includes:

- routing HTTP and HTTPS requests by hostname
- SSL bumping for intercepting HTTPS traffic with trusted clients
- forwarding, rewriting, or fulfilling requests without an upstream round-trip
- combinations of the above

## Usage

```ts
import { RoutingProxy } from '@flexent/http-proxy';

const proxy = new RoutingProxy();
proxy.insertRoute({
    hostPattern: /^api\.example\.com:\d+$/.source,
    upstream: { host: 'localhost:9090' },
});
await proxy.start(8080);
```

For SSL bumping, subclass `SslBumpProxy` and override `handleTls` to inspect or rewrite decrypted traffic.
