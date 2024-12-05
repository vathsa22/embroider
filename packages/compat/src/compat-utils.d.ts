import type { AddonMeta, PackageInfo } from '@embroider/core';
import type { PluginItem } from '@babel/core';
export declare function addPeerDependency(packageJSON: PackageInfo, packageName: string, version?: string): PackageInfo;
export declare function forceIncludeModule(meta: Partial<AddonMeta>, localPath: string): Partial<AddonMeta>;
export declare function forceIncludeTestModule(meta: AddonMeta, localPath: string): AddonMeta;
export declare function stripBadReexportsPlugin(opts?: {
    filenamePattern?: RegExp;
    resolveBase?: string;
}): PluginItem;
