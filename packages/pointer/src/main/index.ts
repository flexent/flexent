export function get(data: any, pointer: string): unknown {
    const path = parsePath(pointer);
    return deepGet(data, path);
}

function deepGet(data: any, path: string[]): unknown {
    let value = data;
    let wasWildcard = false;
    for (const comp of path) {
        if (value == null) {
            break;
        }
        if (Array.isArray(value)) {
            const idx = Number(comp);
            if (comp === '*') {
                wasWildcard = true;
            } else if (!isNaN(idx) && !wasWildcard) {
                value = value[idx];
                wasWildcard = false;
            } else {
                value = value.map(_ => deepGet(_, [comp]));
                wasWildcard = false;
            }
        } else {
            value = value[comp];
            wasWildcard = false;
        }
    }
    return value;
}

export function set(data: any, pointer: string, value: unknown) {
    const path = parsePath(pointer);
    deepApply(data, path, value);
}

/**
 * Parses a string into components. If it starts with `/`,
 * then treats it as a RFC6901-compliant JSON pointer, otherwise
 * treats it as dot-delimited path.
 */
export function parsePath(pointer: string): string[] {
    if (pointer.startsWith('"') && pointer.endsWith('"')) {
        return [
            pointer.substring(1, pointer.length - 1),
        ];
    }
    if (pointer.startsWith('/')) {
        return pointer.split('/').slice(1).map(_ => escapeJsonPointer(_));
    }
    return pointer.split('.').filter(Boolean);
}

function escapeJsonPointer(str: string) {
    return str.replace(/~1/g, '/').replace(/~0/g, '~');
}

function deepApply(data: Record<string, any>, path: string[], value: any): void {
    if (!path.length) {
        return;
    }
    const [comp, ...rest] = path;
    const isArray = Array.isArray(data);
    const val = path.length === 1 ?
        value :
        data[comp] ?? (isArrayComp(rest[0]) ? [] : {});
    if (isArray && comp === '-') {
        data.push(val);
    } else {
        data[comp] = val;
    }
    deepApply(val, rest, value);
}

function isArrayComp(comp: string) {
    return !isNaN(Number(comp)) || comp === '-';
}
