import type { ASTPluginBuilder, ASTPluginEnvironment } from '@glimmer/syntax';
import type { ActivePackageRules } from './dependency-rules';
import type { WithJSUtils } from 'babel-plugin-ember-template-compilation';
import type { ResolverOptions as CoreResolverOptions } from '@embroider/core';
import type CompatOptions from './options';
type Env = WithJSUtils<ASTPluginEnvironment> & {
    filename: string;
    contents: string;
    strictMode?: boolean;
    locals?: string[];
};
type UserConfig = Pick<Required<CompatOptions>, 'staticHelpers' | 'staticModifiers' | 'staticComponents' | 'allowUnsafeDynamicComponents'>;
export interface CompatResolverOptions extends CoreResolverOptions {
    activePackageRules: ActivePackageRules[];
    options: UserConfig;
}
export interface Options {
    appRoot: string;
    emberVersion: string;
}
export default function makeResolverTransform({ appRoot, emberVersion }: Options): ASTPluginBuilder<Env>;
export {};
