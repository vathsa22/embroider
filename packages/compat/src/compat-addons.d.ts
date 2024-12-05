import type { Node } from 'broccoli-node-api';
import type { Stage } from '@embroider/core';
import type CompatApp from './compat-app';
export default class CompatAddons implements Stage {
    private compatApp;
    private didBuild;
    private treeSync;
    readonly inputPath: string;
    private addons;
    constructor(compatApp: CompatApp);
    get tree(): Node;
    ready(): Promise<{
        outputPath: string;
    }>;
    private build;
}
