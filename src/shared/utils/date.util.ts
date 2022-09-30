import { DateFormat, DateTypePerriod, PeriodDateOptionValue, SegmentPeriodOptionValue } from "../constants/common.const";

export abstract class DateUtil {
    private static dateRegExpListInstance: Map<DateFormat, RegExp>;
    private static get dateRegExpList(): Map<DateFormat, RegExp> {
        if (this.dateRegExpListInstance === undefined) {
            this.dateRegExpListInstance = new Map();
            this.dateRegExpListInstance.set('hhmm'          , /^([0-2]{1}\d{1})(\d{2})$/);
            this.dateRegExpListInstance.set('hhmmss'        , /^([0-2]{1}\d{1})(\d{2})(\d{2})$/);
            this.dateRegExpListInstance.set('hhmmssSSS'     , /^([0-2]{1}\d{1})(\d{2})(\d{2})(\d{3})$/);
            this.dateRegExpListInstance.set('yyyymmdd'      , /^([1-2]{1}\d{3})(\d{2})(\d{2})$/);
            this.dateRegExpListInstance.set('yyyymmddhhmm'  , /^([1-2]{1}\d{3})(\d{2})(\d{2})(\d{2})(\d{2})$/);
            this.dateRegExpListInstance.set('yyyymmddhhmmss'  , /^([1-2]{1}\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
            this.dateRegExpListInstance.set('yyyymmddhhmmssSSS', /^([1-2]{1}\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})$/);
            this.dateRegExpListInstance.set('yyyy-mm-dd'    , /^([1-2]{1}\d{3})-(\d{2})-(\d{2})$/);
        }
        return this.dateRegExpListInstance;
    }

    public static isValidFormat(value: string, key: DateFormat): boolean {
        return this.dateRegExpList.get(key)?.test(value) ? true : false;
    }
    public static getDateFormat(value: string): DateFormat {
        let dateFormat: any;
        for (const [format] of this.dateRegExpList) {
            if ( this.isValidFormat(value, format) ) {
                dateFormat = format;
            }
        }
        return dateFormat;
    }
    public static getDateTimeAsString(value: string, isTime?: boolean, isSecond?: boolean): string {
        const mode = this.getDateFormat(value);
        const regexp = this.dateRegExpList.get(mode) as any;
        let result = value.replace(regexp, '$1-$2-$3') ;
        if (isTime) {
            const time = this.getTimeAsString(value, isSecond);
            if (time !== '') {
                result += 'T' + time;
            }
        }
        return result;
    }
    public static getTimeAsString(value: string, isSecond?: boolean): string {
        const previousMode = this.getDateFormat(value);
        let replacePattern = '';
        switch (previousMode) {
            case 'hhmm'  : replacePattern = '$1:$2' + (isSecond ? ':00' : '');           break;
            case 'hhmmss'  : replacePattern = '$1:$2' + (isSecond ? ':$3' : '');         break;
            case 'hhmmssSSS'  : replacePattern = '$1:$2' + (isSecond ? ':$3' : '');      break;
            case 'yyyymmddhhmm' : replacePattern = '$4:$5' + (isSecond ? ':00' : '');    break;
            case 'yyyymmddhhmmss' : replacePattern = '$4:$5' + (isSecond ? ':$6' : '');  break;
            case 'yyyymmddhhmmssSSS' : replacePattern = '$4:$5' + (isSecond ? ':$6' : '');  break;
        }
        const regexp = this.dateRegExpList.get(previousMode) as any;
        const result = value.replace(regexp, replacePattern);
        return result;
    }
    public static getBackDateFromTodayAsString(value: number | string, type: DateTypePerriod): string {
        const date = new Date();
        switch (type) {
            case 'weeks':   date.setDate(date.getDate() - (7 * Number(value))); break;
            case 'months':  date.setDate(date.getDate() - Number(value)); break;
            default: date.setDate(date.getDate() - 7); break;
        }
        return this.getDateToString(date);
    }
    public static getNextDateFromTodayAsString(value: number | string, type: DateTypePerriod): string {
        const date = new Date();
        switch (type) {
            case 'weeks':   date.setDate(date.getDate() + (7 * Number(value))); break;
            case 'months':  date.setDate(date.getDate() + Number(value)); break;
            default: date.setDate(date.getDate() + 7); break;
        }
        return this.getDateToString(date);
    }    
    public static getDateToString(date: Date, type?: 'date'| 'time', format?: 'default'|'server'): string {
        let result: string;
        let regexp: RegExp;
        let pattern: string;
        if (type === 'time') {
            result = date.toTimeString();
            regexp = /^(\d{2}):(\d{2}):(\d{2})$/;
            pattern = (format === 'server') ? '$1$2$3' : '$1:$2:$3';
        } else {
            result = date.toISOString().substring(0, 10);
            regexp = /^(\d{4})-(\d{2})-(\d{2})$/;
            pattern = (format === 'server') ? '$1$2$3' : '$1-$2-$3';
        }
        return result.replace(regexp, pattern);
    }
    public static getBackDatePeriodAsString(period: SegmentPeriodOptionValue): string {
        let date = ''; // 2019-10-08
        switch (period) {
            case PeriodDateOptionValue.ONE_WEEK:
                date = this.getBackDateFromTodayAsString(1, 'weeks');
                break;
            case PeriodDateOptionValue.ONE_MONTH:
                date = this.getBackDateFromTodayAsString(1, 'months');
                break;
            case PeriodDateOptionValue.THREE_MONTH:
                date = this.getBackDateFromTodayAsString(3, 'months');
                break;
            case PeriodDateOptionValue.SIX_MONTH:
                date = this.getBackDateFromTodayAsString(6, 'months');
                break;
        }
        return date;
    }
    public static getNextDatePeriodAsString(period: SegmentPeriodOptionValue): string {
        let date = ''; // 2019-10-08
        switch (period) {
            case PeriodDateOptionValue.ONE_WEEK:
                date = this.getNextDateFromTodayAsString(1, 'weeks');
                break;
            case PeriodDateOptionValue.ONE_MONTH:
                date = this.getNextDateFromTodayAsString(1, 'months');
                break;
            case PeriodDateOptionValue.THREE_MONTH:
                date = this.getNextDateFromTodayAsString(3, 'months');
                break;
            case PeriodDateOptionValue.SIX_MONTH:
                date = this.getNextDateFromTodayAsString(6, 'months');
                break;
        }
        return date;
    }
    public static comparesAsDay(fromDate: Date|string, toDate?: Date|string): number {
        let date1: Date, date2: Date;
        if (fromDate instanceof Date) {
            date1 = fromDate;
        } else {
            date1 = fromDate ? new Date(this.getDateTimeAsString(fromDate)) : new Date();
        }
        if (toDate instanceof Date) {
            date2 = toDate;
        } else {
            date2 = toDate ? new Date(this.getDateTimeAsString(toDate)) : new Date();
        }
        date1.setHours(1);
        date2.setHours(1);
        const totalMs = date2.getTime() - date1.getTime();
        const totalDays = totalMs / (1000 * 60 * 60 * 24); // -> ss -> mn -> hh -> dd
        return Math.round(totalDays);
    }

    public static comparesAsMonth(fromDate: Date|string, toDate?: Date|string, includeDay?: boolean): number {
        let date1: Date, date2: Date;
        if (fromDate instanceof Date) {
            date1 = fromDate;
        } else {
            date1 = fromDate ? new Date(this.getDateTimeAsString(fromDate)) : new Date();
        }
        if (toDate instanceof Date) {
            date2 = toDate;
        } else {
            date2 = toDate ? new Date(this.getDateTimeAsString(toDate)) : new Date();
        }
        const years = date2.getFullYear() - date1.getFullYear();
        let months = date2.getMonth() - date1.getMonth();
        const days = date2.getDate() - date1.getDate();
        months += years * 12;
        if (includeDay && days < 0) {
            months -= 1;
        }
        return months;
    }
    public static getDaysBetweenDates(fromDate: Date|string, toDate?: Date|string): number {
        return Math.abs( this.comparesAsDay(fromDate, toDate) );
    }

    public static getMonthsBetweenDates(fromDate: Date|string, toDate?: Date|string, includeDay?: boolean): number {
        return Math.abs( this.comparesAsMonth(fromDate, toDate, includeDay) );
    }
}