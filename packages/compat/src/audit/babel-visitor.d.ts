import type { TransformOptions } from '@babel/core';
import type { SourceLocation } from '@babel/code-frame';
export declare class VisitorState {
}
export interface InternalImport {
    source: string;
    codeFrameIndex: number | undefined;
    specifiers: {
        name: string | NamespaceMarker;
        local: string | null;
        codeFrameIndex: number | undefined;
    }[];
}
export interface NamespaceMarker {
    isNamespace: true;
}
export declare function isNamespaceMarker(value: string | NamespaceMarker): value is NamespaceMarker;
export interface ExportAll {
    all: string;
}
export declare function auditJS(rawSource: string, filename: string, babelConfig: TransformOptions, frames: CodeFrameStorage): {
    imports: InternalImport[];
    exports: Set<string | ExportAll>;
    isCJS: false;
    isAMD: false;
    problems: {
        message: string;
        detail: string;
        codeFrameIndex: number | undefined;
    }[];
    transpiledContent: string;
};
export declare class CodeFrameStorage {
    private codeFrames;
    private rawSources;
    forSource(rawSource: string): (node: {
        loc?: SourceLocation | null;
    }) => number | undefined;
    render(codeFrameIndex: number | undefined): string | undefined;
}
