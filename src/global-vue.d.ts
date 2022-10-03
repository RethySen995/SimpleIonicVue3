import { DataStoreSharing } from "./shared/services/data-sharing.service";
import FilterService from "./shared/services/filter.service";
import LoggerService from "./shared/services/logger.service";

declare module '@vue/runtime-core' {
    // provide typings for `this.$store`
    interface ComponentCustomProperties {
        $store: DataStoreSharing;
        $logger: LoggerService;
        $filter: FilterService;
        $bizMOB: Record<any, any>;
    }
  }
  export { };
