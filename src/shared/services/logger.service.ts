import moment from 'moment';

export default class LoggerService {

    constructor(localeCd?:string) {
        // do nothing
        if(localeCd) moment.locale(localeCd);  
    }
  public log( message : any ){
    const prefixLogType = "LOG";
    this.consoleLogger( message, prefixLogType );
  }

  public error( message : any ){
      const prefixLogType = "ERROR";
      this.consoleLogger( message, prefixLogType );
  }

  public info( message : any ){
      const prefixLogType = "INFO";
      this.consoleLogger( message, prefixLogType );
  }

  public warn( message : any ){
      const prefixLogType = "WARN";
      this.consoleLogger( message, prefixLogType );
  }

  private consoleLogger( message: any, prefixString: string){
      const prefixTimeStamp = "[" + moment().format('YYYY-MM-DD HH:mm:ss.SSS') + "]";
      
            
      switch (prefixString) {
          case 'LOG':
              if(typeof(message) != "object"){
                  process.env.production ? '' : console.log( prefixTimeStamp + " [" + prefixString +"] " + message );
              }
              else{
                  process.env.production ? '' : console.log( prefixTimeStamp + " [" + prefixString +"] " );
              }
              break;
          case "INFO":
              if(typeof(message) != "object"){
                  process.env.production ? '' : console.info( prefixTimeStamp + " [" + prefixString +"] " + message );
              }
              else{
                  process.env.production ? '' : console.info( prefixTimeStamp + " [" + prefixString +"] " );
              }
              break;
          case "WARN":
              if(typeof(message) != "object"){
                  process.env.production ? '' : console.warn( prefixTimeStamp + " [" + prefixString +"] " + message );
              }
              else{
                  process.env.production ? '' : console.warn( prefixTimeStamp + " [" + prefixString +"] " );
              }
              break;
          case "ERROR":
              if(typeof(message) != "object"){
                  process.env.production ? '' : console.error( prefixTimeStamp + " [" + prefixString +"] "+ message );
              }
              else{
                  process.env.production ? '' : console.error( prefixTimeStamp + " [" + prefixString +"] " );
              }
              break;
      }

  }

}
