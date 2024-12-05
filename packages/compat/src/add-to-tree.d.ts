import type { Node } from 'broccoli-node-api';
import { Funnel } from 'broccoli-funnel';
export default class AddToTree extends Funnel {
    private hook;
    constructor(combinedVendor: Node, hook: (outputPath: string) => Promise<void> | void);
    shouldLinkRoots(): boolean;
    build(): Promise<void>;
}
