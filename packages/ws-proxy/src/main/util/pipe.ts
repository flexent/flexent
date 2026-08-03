import { Duplex } from 'node:stream';

export function pipeBidirectional(left: Duplex, right: Duplex): void {
    let cleaned = false;
    const cleanup = () => {
        if (cleaned) {
            return;
        }
        cleaned = true;
        left.off('error', onLeftError);
        right.off('error', onRightError);
        left.off('close', onLeftGone);
        right.off('close', onRightGone);
        left.off('end', onLeftGone);
        right.off('end', onRightGone);
    };
    const onLeftGone = () => destroyQuietly(right);
    const onRightGone = () => destroyQuietly(left);
    const onLeftError = (error: Error) => destroyQuietly(right, error);
    const onRightError = (error: Error) => destroyQuietly(left, error);
    left.on('error', onLeftError);
    right.on('error', onRightError);
    left.on('close', onLeftGone);
    right.on('close', onRightGone);
    left.on('end', onLeftGone);
    right.on('end', onRightGone);
    left.once('close', cleanup);
    right.once('close', cleanup);
    left.pipe(right, { end: false });
    right.pipe(left, { end: false });
}

function destroyQuietly(socket: Duplex, error?: Error): void {
    if (!socket.destroyed) {
        socket.destroy(error);
    }
}
