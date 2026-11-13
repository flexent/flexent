/** The most arguments a caller passes; past that, an options object. */
const MAX_PARAMS = 4;

/**
 * Arguments from the Flexent methodology: more than four means an options object.
 * Decorated parameters (`@QueryParam('q') q`) are bound by a framework, not passed by callers, so they don't count.
 * Neither does a TypeScript `this` parameter.
 */
export const maxParams = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Keep functions to four caller-supplied parameters (Flexent methodology arguments).',
        },
        schema: [],
        messages: {
            maxParams: '{{count}} parameters: pass an options object once there are more than ' + MAX_PARAMS + '.',
        },
    },
    create(context) {
        const checkFunction = node => {
            const count = node.params.filter(param => isCallerParam(param)).length;
            if (count <= MAX_PARAMS) {
                return;
            }
            context.report({
                node,
                messageId: 'maxParams',
                data: { count },
            });
        };
        return {
            FunctionDeclaration: checkFunction,
            FunctionExpression: checkFunction,
            ArrowFunctionExpression: checkFunction,
            TSDeclareFunction: checkFunction,
            TSEmptyBodyFunctionExpression: checkFunction,
        };
    },
};

function isCallerParam(param) {
    if (param.decorators?.length > 0) {
        return false;
    }
    return !(param.type === 'Identifier' && param.name === 'this');
}
