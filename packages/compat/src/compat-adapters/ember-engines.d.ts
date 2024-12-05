import V1Addon from '../v1-addon';
import Filter from 'broccoli-persistent-filter';
import type { AddonMeta } from '@embroider/core';
declare class Awk extends Filter {
    search: string;
    replace: string;
    constructor(inputNode: any, search: string, replace: string);
    processString(content: string): string;
}
export default class extends V1Addon {
    get packageMeta(): Partial<AddonMeta>;
    get v2Tree(): Awk;
}
export {};
