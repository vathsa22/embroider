import V1Addon from '../../v1-addon';
import Plugin from 'broccoli-plugin';
declare class RedirectToEmber extends Plugin {
    build(): void;
}
export default class extends V1Addon {
    get v2Tree(): RedirectToEmber;
}
export {};
