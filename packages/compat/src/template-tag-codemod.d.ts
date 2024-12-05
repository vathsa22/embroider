import type { EmberAppInstance } from '@embroider/core';
import type { Node } from 'broccoli-node-api';
export interface TemplateTagCodemodOptions {
    shouldTransformPath: (outputPath: string) => boolean;
    dryRun: boolean;
}
export default function templateTagCodemod(emberApp: EmberAppInstance, { shouldTransformPath, dryRun }?: {
    shouldTransformPath?: ((outputPath: string) => boolean) | undefined;
    dryRun?: boolean | undefined;
}): Node;
