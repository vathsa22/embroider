import Plugin from 'broccoli-plugin';
import type { Node } from 'broccoli-node-api';
export declare class WriteV1AppBoot extends Plugin {
    private lastContents;
    constructor();
    build(): void;
}
export declare class ReadV1AppBoot extends Plugin {
    private appBoot;
    private hasBuilt;
    constructor(appBootTree: Node);
    build(): void;
    readAppBoot(): string | undefined;
}
