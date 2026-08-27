import assert from 'assert';

import { ClientClosedError } from '../main/errors.js';
import {
    WsClient,
    WsConnection,
    WsEventListener,
    WsMessageEvent,
} from '../main/WsClient.js';
import { Protocol, protocolIndex } from './protocol.js';

interface ListenerMap {
    open: Set<WsEventListener<unknown>>;
    error: Set<WsEventListener<unknown>>;
    message: Set<WsEventListener<WsMessageEvent>>;
    close: Set<WsEventListener<unknown>>;
}

class MockWs implements WsConnection {

    readyState = 0;
    sent: string[] = [];
    private closed = false;
    private listeners: ListenerMap = {
        open: new Set(),
        error: new Set(),
        message: new Set(),
        close: new Set(),
    };

    addEventListener(type: 'open', listener: WsEventListener<unknown>): void;
    addEventListener(type: 'error', listener: WsEventListener<unknown>): void;
    addEventListener(type: 'message', listener: WsEventListener<WsMessageEvent>): void;
    addEventListener(type: 'close', listener: WsEventListener<unknown>): void;
    addEventListener(type: keyof ListenerMap, listener: WsEventListener<any>): void {
        this.listeners[type].add(listener);
    }

    send(data: string): void {
        this.sent.push(data);
    }

    close(): void {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.readyState = 3;
        for (const listener of this.listeners.close) {
            listener({});
        }
    }

    open(): void {
        this.readyState = 1;
        for (const listener of this.listeners.open) {
            listener({});
        }
    }

    respond(id: number, result: unknown): void {
        const data = JSON.stringify({ id, result });
        for (const listener of this.listeners.message) {
            listener({ data });
        }
    }

}

class TestWsClient extends WsClient<Protocol> {

    sockets: MockWs[] = [];
    reconnect = false;
    retry = true;

    protected get url() {
        return 'ws://test';
    }

    protected get protocol() {
        return protocolIndex;
    }

    protected override shouldReconnectOnClose() {
        return this.reconnect;
    }

    protected override shouldRetry(_attempt: number) {
        return this.retry;
    }

    protected override getRetryIntervalMs() {
        return 0;
    }

    protected override wait(_ms: number) {
        return Promise.resolve();
    }

    protected override createConnection(_url: string): WsConnection {
        const ws = new MockWs();
        this.sockets.push(ws);
        return ws;
    }

    setReconnect(enabled: boolean) {
        this.reconnect = enabled;
        this.reconnectEnabled = enabled;
    }

    get pendingCount() {
        return this.pendingRequests.length;
    }

    get currentWs() {
        return this.ws;
    }

    async triggerClose(ws: WsConnection) {
        await this.onClose(ws);
    }

}

async function connectClient(client: TestWsClient): Promise<MockWs> {
    const promise = client.connect();
    const ws = client.sockets[client.sockets.length - 1];
    ws.open();
    await promise;
    return ws;
}

async function nextConnectingSocket(client: TestWsClient, previous: MockWs): Promise<MockWs> {
    for (let i = 0; i < 50; i++) {
        const next = client.sockets.find(ws => ws !== previous && ws.readyState === 0);
        if (next) {
            return next;
        }
        await Promise.resolve();
    }
    throw new Error('expected reconnect socket');
}

async function reconnectAfterClose(client: TestWsClient, ws: MockWs): Promise<MockWs> {
    const connected = new Promise<void>(resolve => {
        client.connected.once(() => resolve());
    });
    ws.close();
    const next = await nextConnectingSocket(client, ws);
    next.open();
    await connected;
    return next;
}

function parseSent(ws: MockWs) {
    return ws.sent.map(data => JSON.parse(data));
}

describe('WsClient', () => {

    describe('stale close', () => {

        it('current socket close runs handleClose and emits disconnected', async () => {
            const client = new TestWsClient();
            const ws = await connectClient(client);
            let disconnected = 0;
            client.disconnected.on(() => {
                disconnected += 1;
            });
            const pending = client.client.System.getVersion({});
            assert.strictEqual(ws.sent.length, 1);
            ws.close();
            await assert.rejects(pending, err => err instanceof ClientClosedError);
            assert.strictEqual(disconnected, 1);
            assert.strictEqual(client.currentWs, null);
        });

        it('current socket close reconnects when enabled', async () => {
            const client = new TestWsClient();
            client.setReconnect(true);
            const ws1 = await connectClient(client);
            const ws2 = await reconnectAfterClose(client, ws1);
            assert.strictEqual(client.currentWs, ws2);
            assert.strictEqual(client.isConnected, true);
        });

        it('previous socket close after new current is ignored', async () => {
            const client = new TestWsClient();
            client.setReconnect(true);
            const ws1 = await connectClient(client);
            assert.ok(client.client);
            const ws2 = await reconnectAfterClose(client, ws1);
            let disconnected = 0;
            let handleCloseCalls = 0;
            client.disconnected.on(() => {
                disconnected += 1;
            });
            const rpc = (client as any)._rpcClient;
            const original = rpc.handleClose.bind(rpc);
            rpc.handleClose = (keepIds?: ReadonlySet<number>) => {
                handleCloseCalls += 1;
                return original(keepIds);
            };
            await client.triggerClose(ws1);
            assert.strictEqual(disconnected, 0);
            assert.strictEqual(handleCloseCalls, 0);
            assert.strictEqual(client.currentWs, ws2);
            assert.strictEqual(client.sockets.length, 2);
        });

    });

    describe('buffering while reconnect enabled', () => {

        it('queues while disconnected then flushes on connect', async () => {
            const client = new TestWsClient();
            client.setReconnect(true);
            const call = client.client.System.getVersion({});
            assert.strictEqual(client.pendingCount, 1);
            const ws = await connectClient(client);
            assert.strictEqual(ws.sent.length, 1);
            const sent = parseSent(ws)[0];
            ws.respond(sent.id, { version: '9.9.9' });
            const res = await call;
            assert.strictEqual(res.version, '9.9.9');
        });

        it('queued call rejects on disconnect and is not sent later', async () => {
            const client = new TestWsClient();
            client.setReconnect(true);
            const call = client.client.System.getVersion({});
            assert.strictEqual(client.pendingCount, 1);
            client.disconnect();
            await assert.rejects(call, err => err instanceof ClientClosedError);
            assert.strictEqual(client.pendingCount, 0);
            client.setReconnect(true);
            const ws = await connectClient(client);
            assert.strictEqual(ws.sent.length, 0);
        });

        it('flushes queued methods in call order', async () => {
            const client = new TestWsClient();
            client.setReconnect(true);
            const call1 = client.client.System.getVersion({});
            const call2 = client.client.Heartbeat.getAllGroups({});
            assert.strictEqual(client.pendingCount, 2);
            const ws = await connectClient(client);
            const sent = parseSent(ws);
            assert.strictEqual(sent.length, 2);
            assert.strictEqual(sent[0].method, 'getVersion');
            assert.strictEqual(sent[1].method, 'getAllGroups');
            ws.respond(sent[0].id, { version: '1' });
            ws.respond(sent[1].id, { groups: [] });
            await call1;
            await call2;
        });

        it('rejects in-flight on close but flushes unsent queue after reconnect', async () => {
            const client = new TestWsClient();
            client.setReconnect(true);
            const ws1 = await connectClient(client);
            const inFlight = client.client.System.getVersion({});
            assert.strictEqual(ws1.sent.length, 1);
            const inFlightId = parseSent(ws1)[0].id;
            ws1.readyState = 0;
            const queued = client.client.Heartbeat.getAllGroups({});
            assert.strictEqual(client.pendingCount, 1);
            const inFlightRejected = assert.rejects(inFlight, err => err instanceof ClientClosedError);
            const ws2 = await reconnectAfterClose(client, ws1);
            await inFlightRejected;
            const sent = parseSent(ws2);
            assert.strictEqual(sent.length, 1);
            assert.strictEqual(sent[0].method, 'getAllGroups');
            assert.notStrictEqual(sent[0].id, inFlightId);
            ws2.respond(sent[0].id, { groups: [] });
            await queued;
        });

    });

    describe('fail-fast when reconnect disabled', () => {

        it('send while disconnected throws WebSocket not connected', async () => {
            const client = new TestWsClient();
            await assert.rejects(
                () => client.client.System.getVersion({}),
                (err: Error) => err.message === 'WebSocket not connected',
            );
        });

    });

    describe('disconnect', () => {

        it('makes subsequent close from old socket stale', async () => {
            const client = new TestWsClient();
            const ws = await connectClient(client);
            let disconnected = 0;
            client.disconnected.on(() => {
                disconnected += 1;
            });
            client.disconnect();
            assert.strictEqual(client.currentWs, null);
            assert.strictEqual(ws.readyState, 3);
            assert.strictEqual(disconnected, 0);
        });

    });

});
