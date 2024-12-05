import type { AuditBuildOptions } from '../audit';
export declare function buildApp(options: AuditBuildOptions): Promise<void>;
export declare class BuildError extends Error {
    isBuildError: boolean;
    constructor(buildOutput: string);
}
export declare function isBuildError(err: any): err is BuildError;
