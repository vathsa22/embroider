import type { Node } from 'broccoli-node-api';
import Filter from 'broccoli-persistent-filter';
export default class TemplateCompileTree extends Filter {
    constructor(inputTree: Node);
    getDestFilePath(relativePath: string, entry: Parameters<Filter['getDestFilePath']>[1]): string | null;
    processString(source: string, relativePath: string): string;
    baseDir(): string;
}
