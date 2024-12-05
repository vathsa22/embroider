import type { Resolver } from '@embroider/core';
export interface PackageRules {
    package: string;
    semverRange?: string;
    components?: {
        [key: string]: ComponentRules;
    };
    addonModules?: {
        [filename: string]: ModuleRules;
    };
    appModules?: {
        [filename: string]: ModuleRules;
    };
    addonTemplates?: {
        [filename: string]: TemplateRules;
    };
    appTemplates?: {
        [filename: string]: TemplateRules;
    };
}
export interface ActivePackageRules extends PackageRules {
    roots: string[];
}
export interface TemplateRules {
    invokes?: {
        [path: string]: ComponentSnippet[];
    };
    disambiguate?: {
        [dasherizedName: string]: 'component' | 'helper' | 'data';
    };
}
export interface ComponentRules extends TemplateRules {
    yieldsSafeComponents?: (boolean | {
        [name: string]: boolean;
    })[];
    yieldsArguments?: (string | {
        [name: string]: string;
    })[];
    acceptsComponentArguments?: ArgumentMapping[];
    layout?: {
        addonPath?: string;
        appPath?: string;
    };
    safeToIgnore?: boolean;
}
export interface ModuleRules {
    dependsOnComponents?: ComponentSnippet[];
    dependsOnModules?: string[];
}
export type ArgumentMapping = string | {
    name: string;
    becomes: string;
};
type ComponentSnippet = string;
export interface PreprocessedComponentRule {
    yieldsSafeComponents: Required<ComponentRules>['yieldsSafeComponents'];
    yieldsArguments: Required<ComponentRules>['yieldsArguments'];
    argumentsAreComponents: string[];
    safeToIgnore: boolean;
    safeInteriorPaths: string[];
    disambiguate: Record<string, 'component' | 'helper' | 'data'>;
}
export declare function preprocessComponentRule(componentRules: ComponentRules): PreprocessedComponentRule;
export declare function activePackageRules(packageRules: PackageRules[], activePackages: {
    name: string;
    root: string;
    version: string;
}[]): ActivePackageRules[];
export declare function appTreeRulesDir(root: string, resolver: Resolver): string;
export {};
