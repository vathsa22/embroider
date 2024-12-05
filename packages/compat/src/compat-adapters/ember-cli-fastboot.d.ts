import V1Addon from '../v1-addon';
import type { Node } from 'broccoli-node-api';
import type { AddonMeta } from '@embroider/core';
export default class EmberCliFastboot extends V1Addon {
    customizes(...trees: string[]): boolean;
    get v2Trees(): Node[];
    get packageMeta(): Partial<AddonMeta>;
    private expectedFiles;
    private scriptFilter;
    private get appFactoryModule();
}
