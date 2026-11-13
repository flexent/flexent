import { Schema } from 'airtight';

/** A workspace's `package.json`: only the fields repo tools read. */
export interface WorkspacePackage {
    name: string;
    private?: boolean;
}

export const WorkspacePackageSchema = new Schema<WorkspacePackage>({
    type: 'object',
    properties: {
        name: { type: 'string' },
        private: {
            type: 'boolean',
            optional: true,
        },
    },
});
