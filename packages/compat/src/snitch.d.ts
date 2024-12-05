import type { Options as FunnelOptions } from 'broccoli-funnel';
import { Funnel } from 'broccoli-funnel';
import type { Node } from 'broccoli-node-api';
export default class Snitch extends Funnel {
    private allowedPaths;
    private foundBadPaths;
    private mustCheck;
    constructor(inputTree: Node, snitchOptions: {
        allowedPaths: RegExp;
        foundBadPaths: Function;
    }, funnelOptions: FunnelOptions);
    build(): Promise<void>;
}
