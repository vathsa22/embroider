import type { PackageCache } from '@embroider/core';
import { Package } from '@embroider/core';
export default class DummyPackage extends Package {
    private owningAddonRoot;
    constructor(root: string, owningAddonRoot: string, packageCache: PackageCache);
    protected get internalPackageJSON(): import("@embroider/core").PackageInfo;
    get nonResolvableDeps(): Map<string, Package>;
}
