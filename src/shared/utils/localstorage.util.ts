import { LOCAL_STORAGE } from "../constants/localstorage-key.const";

export abstract class UserStorage {
    public static setUserStorage(sKey: LOCAL_STORAGE, value: any) {
        if (value !== undefined && value !== null) {
            value = JSON.stringify(value);
        } else {
            value = '';
        }
        localStorage.setItem(sKey, value);
    }
    public static getUserStorage(sKey: LOCAL_STORAGE): any {
        let result: any = localStorage.getItem(sKey);
        if ( result !== undefined && result?.slice(0,1) !== '0' && result !== ''  ) {
            result = JSON.parse(result);
        }
        return result;
    }
}