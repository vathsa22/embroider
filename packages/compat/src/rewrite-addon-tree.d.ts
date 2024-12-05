import type { Node } from 'broccoli-node-api';
import type { AddonMeta } from '@embroider/core';
type GetMeta = () => Partial<AddonMeta>;
export default function rewriteAddonTree(tree: Node, name: string, moduleName: string): {
    tree: Node;
    getMeta: GetMeta;
};
export {};
