import { Router } from "vue-router";
import LoggerService from "./logger.service";
import { ModalService } from "./modal.service";
class RouterService {
    private logger: LoggerService;
    private modalService: ModalService;
    constructor(
        private router: Router
    ) {
        this.logger = new LoggerService();
        this.modalService = new ModalService();
    }
    public subscribe(url: string ) {
        this.router.push(url).then( () => {
        }).catch( (error) => {
            this.modalService.modalAlert({message: error});
        });
    }
}
export default RouterService