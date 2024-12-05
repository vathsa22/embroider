import type { Package } from '@embroider/core';
import Plugin from 'broccoli-plugin';
export default class extends Plugin {
    private originalPackage;
    private built;
    constructor(originalPackage: Package);
    build(): void;
}
