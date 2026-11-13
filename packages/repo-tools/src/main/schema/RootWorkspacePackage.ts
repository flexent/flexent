import { Schema } from 'airtight';

/** The root `package.json` of a workspace monorepo: only the fields repo tools read. */
export interface RootWorkspacePackage {
    name?: string;
    version: string;
    workspaces: string[];
}

export const RootWorkspacePackageSchema = new Schema<RootWorkspacePackage>({
    type: 'object',
    properties: {
        name: {
            type: 'string',
            optional: true,
        },
        version: { type: 'string' },
        workspaces: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
