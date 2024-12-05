import V1Addon from '../v1-addon';
import type { Node } from 'broccoli-node-api';
export default class extends V1Addon {
    get v2Tree(): Node;
    static shouldApplyAdapter(addonInstance: any): boolean;
}
