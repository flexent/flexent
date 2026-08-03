import { generateKeyPairSync } from 'node:crypto';

import forge from 'node-forge';

const { pki } = forge;

const hour = 60 * 60 * 1000;

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

const cert = pki.createCertificate();
cert.publicKey = pki.publicKeyFromPem(publicKey);
cert.serialNumber = '01';
cert.validity.notBefore = new Date(Date.now() - hour);
cert.validity.notAfter = new Date(Date.now() + hour);
cert.setSubject([
    { name: 'commonName', value: 'localhost' },
    { name: 'organizationName', value: 'Flexent Test CA' },
]);
cert.setIssuer(cert.subject.attributes);
cert.setExtensions([
    {
        name: 'basicConstraints',
        cA: true,
    },
    {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
    },
    {
        name: 'subjectAltName',
        altNames: [
            { type: 2, value: 'localhost' },
            { type: 2, value: '*.localhost' },
            { type: 2, value: 'foo.local' },
            { type: 2, value: 'bar.local' },
        ],
    },
]);
cert.sign(pki.privateKeyFromPem(privateKey), forge.md.sha256.create());

export { privateKey, publicKey };
export const certificate = pki.certificateToPem(cert);
