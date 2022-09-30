import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore} from 'vuex';
import LoggerService from '../services/logger.service';
const logger = new LoggerService();
export interface State {
    dataCenter: object
  }
  
export const key: InjectionKey<Store<State>> = Symbol();

export default createStore<State>({
    state: () => {
        return {
            dataCenter: {} // for connection from component to state. EX: this.$store.state.data = object
        };
    },
    mutations: {
        setObjectByKey(state: any, payload: any) {
            if ( state.dataCenter === undefined) {
                state.dataCenter = {};
            }
            state.dataCenter[payload.key] = payload.value;
            logger.info("keys " + [payload.key] + " was set :" + JSON.stringify(payload.value));
        },
        removeObjectByKey(state: any, payload: any) {
            delete state.dataCenter[payload.key];
            logger.info("keys " + [payload.key] + " was removed.");
        }
    },
    actions: {
        setObjectByKey(context: any, payload: any) {
            context.commit('setObjectByKey', payload);
        },
        removeObjectByKey(context: any, payload: any){
            context.commit('removeObjectByKey',payload);
        }
    },
    getters: {
        getObjectByKey: (state: any) => (payload: any) =>{
            logger.info("keys " + [payload.key] + " has values: " + JSON.stringify(state.dataCenter[payload.key]));
            return JSON.stringify(state.dataCenter[payload.key]);
        }
    }
});
export function useStore() {
    return baseUseStore(key)
  }