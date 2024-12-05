import V1Addon from '../../v1-addon';
export default class extends V1Addon {
    protected suppressesTree(_name: string): boolean;
    reduceInstances(instances: V1Addon[]): V1Addon[];
}
