import V1Addon from '../v1-addon';
import type { Node } from 'broccoli-node-api';
export declare class EmberDataBase extends V1Addon {
    customizes(...names: string[]): boolean;
    static shouldApplyAdapter(addonInstance: any): boolean;
}
export default class EmberData extends EmberDataBase {
    get v2Trees(): Node[];
}
