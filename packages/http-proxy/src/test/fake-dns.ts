import dns from 'node:dns';

const originalLookup = dns.lookup;

export function patchDnsLookup(hardcodedEntries: Array<[string, string]>) {
    dns.lookup = ((
        domain: string,
        options: unknown,
        callback?: (...args: unknown[]) => void,
    ) => {
        const entry = hardcodedEntries.find(([name]) => name === domain);
        if (!entry) {
            return Reflect.apply(originalLookup, dns, [domain, options, callback]);
        }
        const cb = typeof options === 'function' ? options : callback;
        const opts = typeof options === 'object' && options != null ? options as { all?: boolean } : {};
        if (opts.all) {
            cb?.(null, [{ address: entry[1], family: 4 }]);
            return;
        }
        cb?.(null, entry[1], 4);
    }) as typeof dns.lookup;
}
