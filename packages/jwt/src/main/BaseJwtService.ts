import { Schema } from 'airtight';
import jsonwebtoken from 'jsonwebtoken';

export abstract class BaseJwtService {

    abstract algorithm: 'HS256' | 'RS256';
    abstract issuer: string;
    abstract signKey: string;
    abstract verifyKey: string;

    createToken(
        payload: Record<string, any>,
        expiresInSeconds: number,
        options: jsonwebtoken.SignOptions = {},
    ): string {
        return jsonwebtoken.sign({
            payload,
        }, this.signKey, {
            algorithm: this.algorithm,
            issuer: this.issuer,
            expiresIn: expiresInSeconds,
            ...options,
        });
    }

    decodeToken<T>(
        token: string,
        schema: Schema<T>,
        options: jsonwebtoken.VerifyOptions = {},
    ): T {
        const jwt = jsonwebtoken.verify(token, this.verifyKey, {
            issuer: this.issuer,
            ...options,
        });
        if (typeof jwt === 'string' || !jwt.payload) {
            throw new Error('Unsupported JWT');
        }
        return schema.decode(jwt.payload);
    }

}
