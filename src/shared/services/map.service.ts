import LoggerService from "./logger.service";
class MapService {
    private logger: LoggerService;
    constructor(
    ) {
        this.logger = new LoggerService();
    }
}
export default MapService