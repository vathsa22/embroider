import V1Addon from '../v1-addon';
export default class extends V1Addon {
    get v2Tree(): Node;
    private get useStaticEmber();
    private get includedDependencies();
    get newPackageJSON(): import("@embroider/core").PackageInfo;
    customizes(treeName: string): boolean;
    invokeOriginalTreeFor(name: string, opts?: {
        neuterPreprocessors: boolean;
    }): any;
    private customAddonTree;
    private customVendorTree;
    get packageMeta(): Partial<import("@embroider/core").AddonMeta>;
}
