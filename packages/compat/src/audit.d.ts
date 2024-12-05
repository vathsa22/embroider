import type { ExportAll, InternalImport, NamespaceMarker } from './audit/babel-visitor';
import { AuditBuildOptions, AuditOptions } from './audit/options';
import { BuildError, isBuildError } from './audit/build';
export interface AuditMessage {
    message: string;
    detail: string;
    loc: Loc;
    source: string;
    filename: string;
}
export interface Loc {
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
}
export { AuditOptions, AuditBuildOptions, BuildError, isBuildError };
export interface Finding {
    message: string;
    filename: string;
    detail: string;
    codeFrame?: string;
}
export interface Module {
    appRelativePath: string;
    consumedFrom: (string | RootMarker)[];
    imports: Import[];
    exports: string[];
    resolutions: {
        [source: string]: string | null;
    };
    content: string;
}
interface ResolutionFailure {
    isResolutionFailure: true;
}
interface InternalModule {
    consumedFrom: (string | RootMarker)[];
    parsed?: {
        imports: InternalImport[];
        exports: Set<string | ExportAll>;
        isCJS: boolean;
        isAMD: boolean;
        dependencies: string[];
        transpiledContent: string | Buffer;
    };
    resolved?: Map<string, string | ResolutionFailure>;
    linked?: {
        exports: Set<string>;
    };
}
export interface Import {
    source: string;
    specifiers: {
        name: string | NamespaceMarker;
        local: string | null;
    }[];
}
export declare class AuditResults {
    modules: {
        [file: string]: Module;
    };
    findings: Finding[];
    static create(baseDir: string, findings: Finding[], modules: Map<string, InternalModule>): AuditResults;
    humanReadable(): string;
    get perfect(): boolean;
}
export declare class Audit {
    private originAppRoot;
    private options;
    private modules;
    private virtualModules;
    private moduleQueue;
    private findings;
    private frames;
    static run(options: AuditBuildOptions): Promise<AuditResults>;
    constructor(originAppRoot: string, options?: AuditOptions);
    private get pkg();
    private get movedAppRoot();
    private get meta();
    private get babelConfig();
    private get resolverParams();
    private resolver;
    private debug;
    private visitorFor;
    private drainQueue;
    run(): Promise<AuditResults>;
    private handleResolverError;
    private linkModules;
    private linkModule;
    private inspectModules;
    private inspectImports;
    private moduleProvidesName;
    private visitHTML;
    private visitJS;
    private visitHBS;
    private visitJSON;
    private resolveDeps;
    private pushFinding;
    private scheduleVisit;
}
export interface RootMarker {
    isRoot: true;
}
export declare function isRootMarker(value: string | RootMarker | undefined): value is RootMarker;
