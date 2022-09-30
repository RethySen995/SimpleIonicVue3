import { Store } from "vuex";
import { useStore } from "../store";

class DataStoreSharing {
    private static store: Map<string, any>;
    public set(keyString: string, valueObject: any) {
        const store = this.getUseStore();
        store.dispatch('setObjectByKey', {key: keyString, value: valueObject});
    }
    public get(keyString: string) {
        const store = this.getUseStore();
        const getter = store.getters['getObjectByKey'];
        const keyObject = {
            key: keyString
        };
        return getter(keyObject);
    }
    public remove(keyString: string) {
        const store = this.getUseStore();
         store.dispatch('removeObjectByKey', {key: keyString});
    }
    public setUseStore(store: any) {
        if (DataStoreSharing.store === undefined) {
            DataStoreSharing.store = new Map();
        }
        DataStoreSharing.store.set('store',store);
    }
    private getUseStore(): Store<any> {
        if (DataStoreSharing.store === undefined) {
            DataStoreSharing.store = new Map();
            return useStore();
        } else {
            return DataStoreSharing.store.get('store');
        }
    }
}
export default DataStoreSharing

