import type { NodePath } from '@babel/traverse';
import type * as Babel from '@babel/core';
import type { types as t } from '@babel/core';
export type Options = {
    appRoot: string;
};
interface State {
    opts: Options;
}
export default function main(babel: typeof Babel): {
    visitor: {
        Program: {
            enter(path: NodePath<t.Program>, state: State): void;
        };
    };
};
export {};
