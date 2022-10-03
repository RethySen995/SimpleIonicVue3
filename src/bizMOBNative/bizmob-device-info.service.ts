import LoggerService from "@/shared/services/logger.service";
declare let bizMOB: any;
export class BizMOBDeviceInfo {
    private logger = new LoggerService();
    public getDeviceInfo(): object {
        const objDeviceInfo = bizMOB.Device.getInfo();
        if ( typeof objDeviceInfo === 'object' ) {
            this.logger.info('object device information => '+ objDeviceInfo);
            return Object.assign({}, objDeviceInfo);
        } else {
            this.logger.info('device information => '+ objDeviceInfo);
            return objDeviceInfo;
        }
    }
}