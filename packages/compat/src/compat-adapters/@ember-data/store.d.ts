import type { AddonMeta } from '@embroider/core';
import { EmberDataBase } from '../ember-data';
export default class EmberDataStore extends EmberDataBase {
    get packageMeta(): Partial<AddonMeta>;
}
