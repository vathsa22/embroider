import Plugin from 'broccoli-plugin';
import type { Node } from 'broccoli-node-api';
export default class SynthesizeTemplateOnlyComponents extends Plugin {
    private emitted;
    private allowedPaths;
    private templateExtensions;
    constructor(tree: Node, params: {
        allowedPaths: string[];
        templateExtensions: string[];
    });
    build(): Promise<void>;
    private addTemplateOnlyComponent;
    private addTemplateImport;
    private remove;
    private crawl;
}
