import V1Addon from '../v1-addon';
import type { AddonMeta } from '@embroider/core';
export default class extends V1Addon {
    get packageMeta(): Partial<AddonMeta>;
    get v2Tree(): import("broccoli-node-api").Node;
}
