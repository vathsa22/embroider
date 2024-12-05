import type { AddonMeta } from '@embroider/core';
import V1Addon from '../../v1-addon';
export default class EmberDataDebug extends V1Addon {
    get packageMeta(): Partial<AddonMeta>;
    static shouldApplyAdapter(addonInstance: any): boolean;
}
