/**
 * Thrown errors from the Flexent methodology.
 * A catch clause reads its error as `catch (error: any)` and `error?.message`, or omits the binding.
 * Narrowing it (`error: unknown`, `instanceof Error`) adds ceremony without making the code safer.
 */
export const catchError = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Bind caught errors as `catch (error: any)` (Flexent methodology errors).',
        },
        schema: [],
        messages: {
            catchError: 'Read thrown errors as `catch (error: any)` and `error?.message`, ' +
                'or omit the binding (`catch {}`) when the error is unused.',
        },
    },
    create(context) {
        return {
            CatchClause(node) {
                const param = node.param;
                if (param == null || isErrorAny(param)) {
                    return;
                }
                context.report({
                    node: param,
                    messageId: 'catchError',
                });
            },
        };
    },
};

function isErrorAny(param) {
    return param.type === 'Identifier' &&
        param.name === 'error' &&
        param.typeAnnotation?.typeAnnotation.type === 'TSAnyKeyword';
}
