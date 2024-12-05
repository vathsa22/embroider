import Plugin from 'broccoli-plugin';
import type { Node } from 'broccoli-node-api';
export interface ConfigContents {
    modulePrefix: string;
    podModulePrefix?: string;
    EmberENV: unknown;
    APP: unknown;
    rootURL: string;
}
export declare class V1Config extends Plugin {
    private env;
    private lastConfig;
    constructor(configTree: Node, env: string);
    build(): void;
    readConfig(): ConfigContents;
}
export declare class WriteV1Config extends Plugin {
    private inputTree;
    private storeConfigInMeta;
    private testInputTree?;
    private lastContents;
    constructor(inputTree: V1Config, storeConfigInMeta: boolean, testInputTree?: V1Config | undefined);
    build(): void;
}
