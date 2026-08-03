import { HTTP_PORT, HTTPS_PORT } from './env.js';
import { patchDnsLookup } from './fake-dns.js';
import { httpServer, httpsServer, startServer } from './server.js';

before(() => {
    patchDnsLookup([
        ['foo.local', '127.0.0.1'],
        ['bar.local', '127.0.0.1'],
        ['localhost', '127.0.0.1'],
    ]);
});

before(async () => {
    await startServer(httpServer, HTTP_PORT);
    await startServer(httpsServer, HTTPS_PORT);
});

after(async () => {
    httpServer.close();
    httpsServer.close();
});
