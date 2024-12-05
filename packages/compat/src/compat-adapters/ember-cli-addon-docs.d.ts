import V1Addon from '../v1-addon';
export default class extends V1Addon {
    get packageJSON(): import("@embroider/core").PackageInfo;
}
