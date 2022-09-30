import moment from "moment";
import { DateFormat } from "../constants/common.const";
import { DateUtil } from "../utils/date.util";

export class DateTimeFormatService {

    public getDateTimeFomart(value: string, format?: DateFormat): string {
        let result: string;
        switch (format) {
            case 'hhmm':
                result = this.getTimeAsString(value);
                break;
            case 'hhmmss':
                result = this.getTimeAsString(value, true);
                break;
            case 'hhmmssSSS':
                result = this.getTimeAsString(value, true);
                break;                
            case 'yyyymmdd':
                result = this.getDateAsString(value);
                break;
            case 'yyyy-mm-dd':
                result = this.getDateAsString(value);
                break;                
            case 'yyyymmddhhmm':
                result = this.getDateTimeAsString(value);
                break;
            case 'yyyymmddhhmmss':
                result = this.getDateTimeAsString(value, true);
                break;
            case 'yyyymmddhhmmssSSS':
                result = this.getDateTimeAsString(value, true);
                break;                                
            default:
                result = this.getDateAsString(value);
        }
        return result.toLocaleUpperCase();
    }

    private getDateAsString(value: string): string {
        const date = DateUtil.getDateTimeAsString(value);
        return moment(String(date)).format('DD-MMM-YYYY');
    }

    private getDateTimeAsString(value: string, isSecond?: boolean): string {
        const datetime = DateUtil.getDateTimeAsString(value,true);
        const datetimesecond = DateUtil.getDateTimeAsString(value,true,true);

        if (isSecond) {
            return  moment(String(datetimesecond)).format('DD-MMM-YYYY hh:mm:ss a');
        } else {
            return  moment(String(datetime)).format('DD-MMM-YYYY hh:mm a');
        }
    }

    private getTimeAsString(value: string, isSecond?: boolean) {
        const time = DateUtil.getTimeAsString(value);
        const timeSecond = DateUtil.getTimeAsString(value,true);
        if (isSecond) {
            return moment(String(timeSecond), 'hh:mm:ss a').format('hh:mm:ss a');
        } else {
            return moment(String(time), 'hh:mm a').format('hh:mm a');
        }
    }
}