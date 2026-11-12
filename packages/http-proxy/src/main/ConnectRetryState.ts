import net from 'node:net';

/**
 * Tracks timers and sockets for a single retryable CONNECT sequence.
 */
export class ConnectRetryState {

    timers: ReturnType<typeof setTimeout>[] = [];
    openSockets = new Set<net.Socket>();
    completed = false;
    failures = 0;

    trackSocket = (socket: net.Socket) => {
        this.openSockets.add(socket);
        if (this.completed) {
            socket.destroy();
        }
    };

    complete(winner: net.Socket) {
        this.completed = true;
        this.cancel(winner);
    }

    cancel(winner?: net.Socket) {
        for (const timer of this.timers) {
            clearTimeout(timer);
        }
        for (const socket of this.openSockets) {
            if (socket !== winner) {
                socket.destroy();
            }
        }
        this.openSockets.clear();
    }

}
