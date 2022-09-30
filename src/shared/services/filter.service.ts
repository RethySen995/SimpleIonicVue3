import { DateTimeFormatService } from "./datetime-format.service";
class FilterService {
    private datetime: DateTimeFormatService;
    constructor() {
        this.datetime = new DateTimeFormatService();
    }
    datetimeFormat(value: any) {
        return this.datetime.getDateTimeFomart(value);
    }
    accountFormat(value: any) {
        return value
    }
    currencyFormat(value: any) {
        return value;
    }


}
export default FilterService