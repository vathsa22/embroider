import type { V1AddonConstructor } from './v1-addon';
import type { Node } from 'broccoli-node-api';
import type { Options as CoreOptions } from '@embroider/core';
import type { PackageRules } from './dependency-rules';
export default interface Options extends CoreOptions {
    staticAddonTrees?: boolean;
    staticAddonTestSupportTrees?: boolean;
    staticEmberSource?: boolean;
    compatAdapters?: Map<string, V1AddonConstructor | null>;
    extraPublicTrees?: Node[];
    packageRules?: PackageRules[];
    allowUnsafeDynamicComponents?: boolean;
}
export declare function optionsWithDefaults(options?: Options): Required<Options>;
export declare const recommendedOptions: {
    [name: string]: Options;
};
