import V1Addon from './v1-addon';
import type { PackageCache } from '@embroider/core';
import type CompatApp from './compat-app';
export default class V1InstanceCache {
    private app;
    private packageCache;
    private addons;
    private orderIdx;
    constructor(app: CompatApp, packageCache: PackageCache);
    private adapterClass;
    private addAddon;
    getAddons(root: string): V1Addon[];
}
