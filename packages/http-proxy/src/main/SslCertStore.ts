import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import net from 'node:net';
import tls from 'node:tls';

import { LRUCache } from 'lru-cache';
import forge from 'node-forge';

import { SslBumpConfig } from './SslBumpProxy.js';

const { md, pki } = forge;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Issues temporary certificates and caches them as connections arrive.
 */
export class SslCertStore extends EventEmitter {

    protected caCert: forge.pki.Certificate;
    protected caCertPem: string;
    protected caPrivateKey: forge.pki.rsa.PrivateKey;
    protected certPublicKey: forge.pki.rsa.PublicKey;
    protected certPrivateKey: forge.pki.rsa.PrivateKey;
    protected certPrivateKeyPem: string;
    protected certTtlDays: number;
    protected certPemCache: LRUCache<string, string>;

    constructor(config: SslBumpConfig) {
        super();
        const { privateKey, publicKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                format: 'pem',
                type: 'spki',
            },
            privateKeyEncoding: {
                format: 'pem',
                type: 'pkcs8',
            },
        });
        this.caCert = pki.certificateFromPem(config.caCert);
        this.caCertPem = pki.certificateToPem(this.caCert);
        this.caPrivateKey = pki.privateKeyFromPem(config.caPrivateKey);
        this.certPublicKey = pki.publicKeyFromPem(publicKey);
        this.certPrivateKey = pki.privateKeyFromPem(privateKey);
        this.certPrivateKeyPem = pki.privateKeyToPem(this.certPrivateKey);
        this.certTtlDays = config.certTtlDays;
        this.certPemCache = new LRUCache({
            max: config.certCacheMaxEntries,
            ttl: this.certTtlDays * DAY - HOUR,
        });
    }

    /**
     * Creates a decrypted TLS socket from an encrypted `clientSocket`.
     */
    bumpClientSocket(hostname: string, clientSocket: net.Socket): tls.TLSSocket {
        const secureContext = this.createSecureContextForHostname(hostname);
        return new tls.TLSSocket(clientSocket, {
            isServer: true,
            secureContext,
            ALPNProtocols: ['http/1.1'],
        });
    }

    createSecureContextForHostname(hostname: string): tls.SecureContext {
        const cert = this.getCertificate(hostname);
        return tls.createSecureContext({
            key: this.certPrivateKeyPem,
            cert,
            ca: this.caCertPem,
        });
    }

    /**
     * Returns a temporary certificate for the hostname
     * (from cache or newly generated).
     */
    getCertificate(hostname: string): string {
        const parentDomain = hostname.split('.').slice(1).join('.');
        const cached = this.certPemCache.get(hostname) || this.certPemCache.get(parentDomain);
        if (cached) {
            return cached;
        }
        const cert = this.createCertificate(hostname);
        this.certPemCache.set(hostname, cert);
        return cert;
    }

    /**
     * Creates a new temporary certificate for the hostname, ignoring the cache.
     */
    createCertificate(hostname: string): string {
        const cert = pki.createCertificate();
        cert.publicKey = this.certPublicKey;
        // Hex string — do not parse as Number (8 bytes exceeds MAX_SAFE_INTEGER).
        cert.serialNumber = randomBytes(8).toString('hex');
        cert.validity.notBefore = new Date(Date.now() - DAY);
        cert.validity.notAfter = new Date(Date.now() + this.certTtlDays * DAY);
        cert.setSubject([
            { name: 'commonName', value: hostname },
            { name: 'organizationName', value: 'Flexent' },
        ]);
        cert.setIssuer(this.caCert.subject.attributes);
        cert.setExtensions([
            {
                name: 'basicConstraints',
                cA: false,
            },
            {
                name: 'keyUsage',
                digitalSignature: true,
                keyEncipherment: true,
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
            },
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: hostname },
                    { type: 2, value: `*.${hostname}` },
                ],
            },
        ]);
        cert.sign(this.caPrivateKey, md.sha256.create());
        const pem = pki.certificateToPem(cert);
        this.emit('certificateIssued', { hostname, pem });
        return pem;
    }

}
