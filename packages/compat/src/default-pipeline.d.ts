import type { Options } from '.';
import type { PackagerConstructor, Variant, EmberAppInstance } from '@embroider/core';
import type { Node } from 'broccoli-node-api';
export interface PipelineOptions<PackagerOptions> extends Options {
    packagerOptions?: PackagerOptions;
    onOutputPath?: (outputPath: string) => void;
    variants?: Variant[];
}
export declare function stableWorkspaceDir(appRoot: string, environment: string): string;
export default function defaultPipeline<PackagerOptions>(emberApp: EmberAppInstance, packager?: PackagerConstructor<PackagerOptions>, options?: PipelineOptions<PackagerOptions>): Node;
