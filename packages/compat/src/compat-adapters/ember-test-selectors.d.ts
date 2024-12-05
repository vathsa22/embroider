import V1Addon from '../v1-addon';
export default class extends V1Addon {
    static shouldApplyAdapter(addonInstance: any): boolean;
    get packageMeta(): Partial<import("@embroider/core").AddonMeta>;
}
