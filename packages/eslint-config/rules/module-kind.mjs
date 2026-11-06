import { basename } from 'node:path';

/** Modules that hold types, constants, errors or an entry point; they may sit in any directory. */
const NEUTRAL = new Set(['index', 'types', 'constants', 'errors', 'main', 'entrypoint', 'cli']);

/**
 * Module kinds from the Flexent methodology.
 * A PascalCase module is a class module: no top-level functions, one class named after the file.
 * A kebab-case module is a helper module: functions only, no classes.
 * Error classes may accompany the class they belong to.
 */
export const moduleKind = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Keep class modules and helper modules apart (Flexent methodology module kinds).',
        },
        schema: [],
        messages: {
            functionInClassModule: 'Top-level function `{{name}}` in class module {{file}}: ' +
                'make it a method, or move it to a helper module.',
            classInHelperModule: 'Class `{{name}}` in helper module {{file}}: ' +
                'name the module after the class, or move the class out.',
            misnamedModule: 'Class module {{file}} exports `{{name}}`: name the module after its class.',
            extraClass: 'Class module {{file}} exports a second class `{{name}}`: give it its own module.',
            helperName: 'Helper module {{file}} should be kebab-case.',
        },
    },
    create(context) {
        const file = basename(context.filename);
        const name = file.replace(/\.[cm]?[jt]sx?$/, '');
        if (NEUTRAL.has(name)) {
            return {};
        }
        const isClassModule = /^[A-Z]/.test(name);
        return {
            Program(program) {
                const declarations = program.body.map(node => node.declaration ?? node);
                const classes = declarations.filter(node => node?.type === 'ClassDeclaration' && node.id);
                const functions = declarations.flatMap(node => topLevelFunctions(node));
                if (isClassModule) {
                    checkClassModule(context, file, name, classes, functions);
                    return;
                }
                checkHelperModule(context, file, name, classes, functions);
            },
        };
    },
};

function topLevelFunctions(node) {
    if (node?.type === 'FunctionDeclaration' && node.id) {
        return [node];
    }
    if (node?.type !== 'VariableDeclaration') {
        return [];
    }
    return node.declarations.filter(declarator => {
        const type = declarator.init?.type;
        return type === 'ArrowFunctionExpression' || type === 'FunctionExpression';
    });
}

function checkClassModule(context, file, name, classes, functions) {
    for (const node of functions) {
        context.report({
            node,
            messageId: 'functionInClassModule',
            data: {
                file,
                name: node.id.name,
            },
        });
    }
    const owned = classes.filter(node => !node.id.name.endsWith('Error'));
    if (owned.length > 0 && !owned.some(node => node.id.name === name)) {
        context.report({
            node: owned[0],
            messageId: 'misnamedModule',
            data: {
                file,
                name: owned[0].id.name,
            },
        });
    }
    for (const node of owned.filter(node => node.id.name !== name).slice(1)) {
        context.report({
            node,
            messageId: 'extraClass',
            data: {
                file,
                name: node.id.name,
            },
        });
    }
}

function checkHelperModule(context, file, name, classes, functions) {
    for (const node of classes) {
        context.report({
            node,
            messageId: 'classInHelperModule',
            data: {
                file,
                name: node.id.name,
            },
        });
    }
    if (classes.length + functions.length > 0 && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        context.report({
            node: classes[0] ?? functions[0],
            messageId: 'helperName',
            data: { file },
        });
    }
}
