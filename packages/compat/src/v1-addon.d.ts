import type { Node } from 'broccoli-node-api';
import type { AddonMeta, PackageCache, AddonInstance, AddonTreePath } from '@embroider/core';
import type Options from './options';
import type CompatApp from './compat-app';
export default class V1Addon {
    protected addonInstance: AddonInstance;
    protected addonOptions: Required<Options>;
    protected app: CompatApp;
    private packageCache;
    private orderIdx;
    constructor(addonInstance: AddonInstance, addonOptions: Required<Options>, app: CompatApp, packageCache: PackageCache, orderIdx: number);
    reduceInstances(instances: V1Addon[]): V1Addon[];
    private get templateCompilerBabelPlugin();
    private updateRegistry;
    private needsInlineHBS;
    private needsCustomBabel;
    get name(): string;
    protected get packageJSON(): import("@embroider/core").PackageInfo;
    protected get newPackageJSON(): import("@embroider/core").PackageInfo;
    get root(): string;
    private get mainModule();
    protected get options(): any;
    protected customizes(...treeNames: string[]): boolean;
    private customizesHookName;
    private hasStockTree;
    hasAnyTrees(): boolean;
    private stockTreeFunnelOptions;
    protected stockTree(treeName: AddonTreePath): Node;
    protected get rootTree(): Node;
    private get moduleName();
    private transpile;
    protected updateBabelConfig(): void;
    get v2Tree(): Node;
    protected get packageMeta(): Partial<AddonMeta>;
    protected get v2Trees(): Node[];
    protected throughTreeCache(nameOrNames: string | string[], category: string, fn: () => Node): Node;
    protected suppressesTree(name: string): boolean;
    protected invokeOriginalTreeFor(name: string, { neuterPreprocessors }?: {
        neuterPreprocessors: boolean;
    }): Node | undefined;
    protected treeForAddon(built: IntermediateBuild): Node | undefined;
    protected addonStylesTree(): Node | undefined;
    protected treeForTestSupport(): Node | undefined;
    private buildTreeForAddon;
    private buildAddonStyles;
    private buildTreeForStyles;
    private buildAddonTestSupport;
    private maybeSetDirectoryMeta;
    private buildTestSupport;
    private buildTreeForApp;
    private buildTreeForFastBoot;
    private buildPublicTree;
    private buildVendorTree;
    private isEngine;
    private buildEngineConfig;
    private buildPackageJSON;
    private build;
}
export interface V1AddonConstructor {
    new (addonInstance: any, options: Required<Options>, app: CompatApp, packageCache: PackageCache, orderIdx: number): V1Addon;
    shouldApplyAdapter?(addonInstance: any): boolean;
}
declare class IntermediateBuild {
    trees: Node[];
    staticMeta: {
        [metaField: string]: any;
    };
    dynamicMeta: (() => Partial<AddonMeta>)[];
}
export {};
