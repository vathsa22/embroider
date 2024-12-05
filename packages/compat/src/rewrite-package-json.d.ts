import Plugin from 'broccoli-plugin';
import type { Node } from 'broccoli-node-api';
export default class RewritePackageJSON extends Plugin {
    private getPackageJSON;
    constructor(inputTree: Node, getPackageJSON: () => any);
    build(): void;
}
