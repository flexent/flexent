/** Static members allowed on any class: the named constructors from the Flexent methodology. */
const DEFAULT_ALLOW = ['create', 'decode'];

/**
 * Static members from the Flexent methodology.
 * Statics escape IoC, so they're kept to named constructors (`create`, `decode`).
 * `XCatalog` classes, the registries of kinds, are the one static-only exception.
 */
export const staticMembers = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Keep static members to named constructors (Flexent methodology objects).',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allow: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            staticMethod: 'Static method `{{name}}` on `{{className}}`: make it an instance method on the owner ' +
                'of its data, or a helper as a last resort. Statics are only for {{allowed}}.',
            staticField: 'Static field `{{name}}` on `{{className}}`: static state is shared by every container. ' +
                'Make it an instance field, or a module constant next to the class.',
            staticBlock: 'Static block on `{{className}}`: static state is shared by every container. ' +
                'Initialize an instance instead.',
        },
    },
    create(context) {
        const allow = new Set(context.options[0]?.allow ?? DEFAULT_ALLOW);
        const allowed = [...allow].map(name => `\`${name}\``).join(', ') || 'nothing';
        const checkClass = node => {
            const className = node.id?.name ?? 'anonymous class';
            if (className.endsWith('Catalog')) {
                return;
            }
            for (const member of node.body.body) {
                checkMember(context, member, {
                    allow,
                    allowed,
                    className,
                });
            }
        };
        return {
            ClassDeclaration: checkClass,
            ClassExpression: checkClass,
        };
    },
};

function checkMember(context, member, { allow, allowed, className }) {
    if (member.type === 'StaticBlock') {
        context.report({
            node: member,
            messageId: 'staticBlock',
            data: { className },
        });
        return;
    }
    if (!member.static) {
        return;
    }
    const name = memberName(context, member);
    if (allow.has(name)) {
        return;
    }
    context.report({
        node: member,
        messageId: isMethod(member) ? 'staticMethod' : 'staticField',
        data: {
            name,
            className,
            allowed,
        },
    });
}

function memberName(context, member) {
    if (member.computed) {
        return context.sourceCode.getText(member.key);
    }
    if (member.key.type === 'PrivateIdentifier') {
        return `#${member.key.name}`;
    }
    return member.key.name ?? String(member.key.value);
}

function isMethod(member) {
    if (member.type === 'MethodDefinition' || member.type === 'TSAbstractMethodDefinition') {
        return true;
    }
    const type = member.value?.type;
    return type === 'ArrowFunctionExpression' || type === 'FunctionExpression';
}
