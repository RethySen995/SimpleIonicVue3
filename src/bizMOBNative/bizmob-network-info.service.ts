import LoggerService from "@/shared/services/logger.service";
declare let bizMOB: any;
export class BizMOBNetworkInfo {
    private logger = new LoggerService();
    public getNetworkInfo(): any {
        bizMOB.System.getNetworkInfo({
            _fCallback: function (res: any) {
              if ( res ) {
                return JSON.stringify(res);
              } else {
                this.logger.info('get network infomation => ' + res);
              }
            }
          }).catch( (error: any) => {
            this.logger.error(error);
          });
    }
}