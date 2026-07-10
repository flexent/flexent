import { Duplex } from 'node:stream';

export function pipeBidirectional(left: Duplex, right: Duplex): void {
    const onLeftError = (error: Error) => destroyQuietly(right, error);
    const onRightError = (error: Error) => destroyQuietly(left, error);
    const onClose = () => {
        left.off('error', onLeftError);
        right.off('error', onRightError);
        left.off('close', onClose);
        right.off('close', onClose);
    };
    left.on('error', onLeftError);
    right.on('error', onRightError);
    left.on('close', onClose);
    right.on('close', onClose);
    left.pipe(right, { end: false });
    right.pipe(left, { end: false });
}

function destroyQuietly(socket: Duplex, error?: Error): void {
    if (!socket.destroyed) {
        socket.destroy(error);
    }
}
