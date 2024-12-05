import Plugin from 'broccoli-plugin';
import type { Node } from 'broccoli-node-api';
export default class SmooshPackageJSON extends Plugin {
    constructor(inputTrees: Node[], opts?: {
        annotation?: string;
    });
    build(): void;
}
