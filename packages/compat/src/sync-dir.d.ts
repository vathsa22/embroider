export declare class SyncDir {
    private src;
    private dest;
    private prev;
    readonly files: Set<string>;
    constructor(src: string, dest: string | undefined);
    update(): void;
}
