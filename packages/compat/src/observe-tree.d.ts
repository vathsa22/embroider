import type { Node } from 'broccoli-node-api';
import { Funnel } from 'broccoli-funnel';
export default class ObserveTree extends Funnel {
    private hook;
    constructor(combinedVendor: Node, hook: (outputPath: string) => Promise<void> | void);
    build(): Promise<void>;
}
