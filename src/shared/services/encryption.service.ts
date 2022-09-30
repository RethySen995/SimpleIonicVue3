import LoggerService from "./logger.service";

declare let CryptoJS: any;
declare let JSEncrypt: any;

export class EncryptionService{
    private logger: LoggerService;
    private scripts: any = {};
    private myScripts = [
      { name: 'AES', src: './assets/js/aes.js'},
      { name: 'Encript', src: './assets/js/jsencript.js'},
      { name: 'PBJDF2', src: './assets/js/pbkdf2.js'}
      ];
    constructor(
    ) {
        this.logger = new LoggerService();
        this.myScripts.forEach((script: any) => {
            this.scripts[script.name] = {
              loaded: false,
              src: script.src
            };
        });
    }

    public encrypt(plaintext: any, password: any) {
        const josnPlainText = JSON.stringify(plaintext);
        const iv = CryptoJS.lib.WordArray.random(128 / 8);
        const key = CryptoJS.enc.Hex.parse(CryptoJS.SHA1(password).toString().substring(0, 32));
        const ct = CryptoJS.AES.encrypt(josnPlainText, key, { iv:iv });
        return iv.concat(ct.ciphertext).toString();
    }
    public decrypt(plaintext: any, password: any) {
        const decrypted = CryptoJS.AES.decrypt({
              ciphertext: CryptoJS.enc.Hex.parse(plaintext.substring(32))
            },
            CryptoJS.enc.Hex.parse(CryptoJS.SHA1(password).toString().substring(0, 32)),
            {
                iv: CryptoJS.enc.Hex.parse(plaintext.substring(0, 32))
            }).toString(CryptoJS.enc.Utf8);
        return decrypted;
    }
    // load a single or multiple scripts
  load(...scripts: string[]) {
    const promises: any[] = [];
    // push the returned promise of each loadScript call 
    scripts.forEach((script) => promises.push(this.loadScript(script)));
    // return promise.all that resolves when all promises are resolved
    return Promise.all(promises);
  }
  
  // load the script
  loadScript(name: string) {
    return new Promise((resolve) => {
      // resolve if already loaded
      if (this.scripts[name].loaded) {
        resolve({script: name, loaded: true, status: 'Already Loaded'});
      } else {
        // load script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this.scripts[name].src;
        script.onload = () => {
            this.scripts[name].loaded = true;
            resolve({script: name, loaded: true, status: 'Loaded'});
            this.logger.info("js already loaded Script!!");
        };
        script.onerror = (error: any) => {
          resolve({script: name, loaded: false, status: 'Error'});
          this.logger.error(error);
        };
        document.getElementsByTagName('head')[0].appendChild(script);
        // finally append the script tag in the DOM
      }
    });
  }

  public registerRSA():Promise<any> {
    const encryptedRSA = new Promise((resolve) => {
      // temp set for testing Public RSA Key
      const publicKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkcKD87/OuMqX65XNOH9GJsYwKchkbvQM3U6vRh4cYYEuC5PqKmRDSiok0+QnDz5L/VuCYoIhxutS0K8fljJ6uuaWl0+VE8oS4EhagIWtXuBCi7BMWCMpXBy4Krhmvnnu2dGrJRU2+2n9YHFkljIFqC2O17JGAVAeMd/RrFYSbdf+GFxYN8O0tDOsp3YxCQa2z0WX1zJK0WpPBBFRukiBTjKGZnAs9gqw+dm7I7uKuVDTIb+n3vk7uwKMda/BQhP8TBZ1KVt0puExex8ejieyxHu4JxAdZM85J6x4CtevSBqGbOseGXBTtJUawjBr2CcI6+I6ECQU4hXw2fe4apw/JwIDAQAB";
      // need to request to server for get plublic RSA ke.

      resolve(publicKey);
    });
    return encryptedRSA;
  }

  public registerAES(publicKey: any): Promise<any> {
    const encryptedAES = new Promise((resolve) => {
      this.load("Encript").then(() => {
          const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          const bit = 128;
          const encrypt = new JSEncrypt();
          let aesKey = "";
          for (let idx = 0; idx < bit; idx++) {
            aesKey += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          // set public RSA Key 
          encrypt.setPublicKey(publicKey);
          resolve(aesKey);
          // need to submit to service to comparation Encryption Key
      });
    });
    return encryptedAES;
  }
    
}