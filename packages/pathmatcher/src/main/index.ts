export interface PathToken {
    type: 'string' | 'param';
    value: string;
    wildcard?: boolean;
}

export type PathParams = Record<string, string>;

/**
 * Parses /foo/{fooId}/bar/{barId} to extract static and parameter tokens.
 * Trailing slash is always discarded.
 */
export function parsePath(path: string): PathToken[] {
    path = path.replace(/\/+$/, '');
    const tokens: PathToken[] = [];
    const re = /\{(.*?)\}|\*/ig;
    let idx = 0;
    let m = re.exec(path);
    while (m != null) {
        const prefix = path.substring(idx, m.index);
        if (prefix) {
            tokens.push({ type: 'string', value: prefix });
        }
        idx = m.index + m[0].length;
        if (m[0] === '*') {
            tokens.push({ type: 'param', value: '*', wildcard: true });
        } else {
            let value = m[1];
            let wildcard = false;
            if (value.startsWith('*')) {
                value = value.substring(1);
                wildcard = true;
            }
            tokens.push({ type: 'param', value, wildcard });
        }
        m = re.exec(path);
    }
    const suffix = path.substring(idx);
    if (suffix) {
        tokens.push({ type: 'string', value: suffix });
    }
    return tokens;
}

export function matchPath(path: string, value: string, prefix = false) {
    const tokens = parsePath(path);
    return matchTokens(tokens, value, prefix);
}

/**
 * Matches `value` against a list of path tokens, obtained from `parsePath`.
 * If `prefix` is true, only matches the beginning of the value, allowing suffix which does not match the tokens.
 */
export function matchTokens(
    tokens: PathToken[],
    value: string,
    prefix = false
): PathParams | null {
    value = value.replace(/\/+$/, '');
    const params: PathParams = {};
    const regex = tokens
        .map(tok => tokenToRegexp(tok))
        .join('');
    const re = new RegExp(`^${regex}${prefix ? '(?=$|/)' : '$'}`);
    const m = re.exec(value);
    if (m == null) {
        return null;
    }
    const paramNames = tokens.filter(_ => _.type === 'param').map(_ => _.value);
    for (const [i, name] of paramNames.entries()) {
        params[name] = decodeURIComponent(m[i + 1]);
    }
    return params;
}

function tokenToRegexp(token: PathToken) {
    if (token.type === 'string') {
        return escapeRegexp(token.value);
    }
    return token.wildcard ? '(.+)' : '([^/]+)';
}

function escapeRegexp(string: string) {
    return string
        .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        .replace(/-/g, '\\x2d');
}
