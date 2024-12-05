import V1Addon from '../v1-addon';
import Filter from 'broccoli-persistent-filter';
declare class Awk extends Filter {
    searchReplaceObj: {
        [key: string]: string;
    };
    constructor(inputNode: any, searchReplaceObj: {
        [key: string]: string;
    });
    processString(content: string): string;
}
export default class extends V1Addon {
    get v2Tree(): Awk;
}
export {};
