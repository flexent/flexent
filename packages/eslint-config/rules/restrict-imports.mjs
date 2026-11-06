/**
 * Keeps heavy runtime packages (Three.js, Manifold, a scene builder…) out of the main bundle:
 * the listed files may not import them, so they only reach the app through lazy chunks.
 *
 *     restrictImports({
 *         files: ['apps/site/{pages,views,components,managers}/**'],
 *         packages: ['three', 'manifold-3d'],
 *         message: 'Import from a lazily loaded module under scenes/.',
 *     })
 */
export function restrictImports({ files, packages, message }) {
    return {
        files,
        rules: {
            'no-restricted-imports': ['error', {
                paths: packages.map(name => ({
                    name,
                    message,
                })),
                patterns: packages.map(name => ({
                    group: [`${name}/*`],
                    message,
                })),
            }],
        },
    };
}
