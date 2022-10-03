import LoggerService from "@/shared/services/logger.service";
declare let bizMOB: any;
export class BizMOBLocalStorage {
    private logger = new  LoggerService();
    public setStorage(key: string, value: any) {
        bizMOB.Properties.set({
            "_sKey": key,
            "_vValue": value
        }).catch( (error: any) => {
            throw new Error(error);
        });
    }
    public setListStorage( arrList: [{ '_sKey': string, '_vValue': any}] ) {
        bizMOB.Properties.set({'_aList': arrList}).catch( (error: any) => {
            this.logger.error(error);
        });
    }
    public getStorage(key: string): any {
        let result; 
        result = bizMOB.Properties.get({
            '_sKey': key
        }).catch( (error: any) => {
            result = undefined;
            this.logger.error(error);
        } );
        return result;
    }
    public removeStorage(key: string) {
        bizMOB.Properties.remove({'_sKey': key}).catch( (error: any) => {
            this.logger.error(error);
        });
    }
}