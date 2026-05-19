import { config } from 'mesh-config';

import { BaseJwtService } from './BaseJwtService.js';

export class JwtService extends BaseJwtService {

    @config({ default: 'RS256' }) private JWT_ALGORITHM!: 'HS256' | 'RS256';
    @config() private JWT_ISSUER!: string;
    @config() private JWT_PUBLIC_KEY!: string;
    @config() private JWT_PRIVATE_KEY!: string;

    get algorithm() {
        return this.JWT_ALGORITHM;
    }

    get issuer() {
        return this.JWT_ISSUER;
    }

    get verifyKey() {
        return this.JWT_PUBLIC_KEY;
    }

    get signKey() {
        return this.JWT_PRIVATE_KEY;
    }

}
