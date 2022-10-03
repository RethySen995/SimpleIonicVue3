/**
 * 01.클래스 설명 : bizMOBCore 최상위 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : bizMOBCore 최상위 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */

var bizMOBCore = {};
var bizMOB = window.bizMOB;

bizMOBCore.version = "4.0";
// 커맨드 작업을 수행하고 있는지여부 check
bizMOBCore.readystatus = false;
bizMOBCore.loglevel = "1248";  //Log(1)Debug(2)Wargin(4)Error(8)

// Class별 Config init
bizMOBCore.initConfig = function(arg) {
    for (var key in arg) {
        if (Object.hasOwnProperty.call(arg, key)) {
            var module = bizMOBCore[key];
            var data = arg[key];

            if (!module) {
                bizMOBCore.Module.logger("Module", "init" ,"E", "Not found module: " + key);
                continue;
            }

            if (!module.init || typeof module.init !== "function") {
                bizMOBCore.Module.logger("Module", "init" ,"E", "Not found module init: " + key);
            }

            module.init(data);
        }
    }
};

/**
 *
 * 01.클래스 설명 : Native 파트와 통신시 Async 로 호출받은 Callback 함수 관리 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : Callback 함수 관리 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.CallbackManager = new Object();

bizMOBCore.CallbackManager.servicename = "CallbackManager";

bizMOBCore.CallbackManager.index = 0;

bizMOBCore.CallbackManager.storage = {};

bizMOBCore.CallbackManager.listener = {};

/**
 * Callback 함수 저장
 *
 * @param Function fCallback	저장 할 callback함수.
 * @param String sType	저장할 타입(stg : 1회성, lsn : 반복성 ).
 * @param String sName	저장할 콜백 이름(alias).
 *
 * @return String callbackId
 */
bizMOBCore.CallbackManager.save = function(fCallback, sType, sName){

    var action = "save";
    var callbackId = "";

    if(!fCallback){
        bizMOBCore.Module.logger(this.servicename, action ,"L", "Callback function is not defined.");
        // 없으면 가상으로 echo
        fCallback =  bizMOBCore.Module.echo;
    }

    // listener, custom: 1회성X --> listener에 저장
    // callback: 1회성 --> storage에 저장
    switch(sType){
        case "listener" :
            callbackId = "lsn"+this.index++;
            // listener에 callbackID랑 callback함수 저장
            this.listener[callbackId] = fCallback;
            bizMOBCore.Module.logger(this.servicename, action, "L", " Callback listener saved the function at "+callbackId+" area.");
            break;
        case "custom" :
            if(!sName){
                bizMOBCore.Module.logger(this.servicename, action ,"L", "Callback function custom name is not defined.");
            }
            callbackId = "cst_"+sName;
            // listener에 callbackID(cst_ + alias) 랑 callback함수 저장
            this.listener[callbackId] = fCallback;
            bizMOBCore.Module.logger(this.servicename, action, "L", " Callback listener saved the function at "+callbackId+" area.");
            break;
        default :
            callbackId = "stg"+this.index++;
            // storage에 callbackID랑 callback함수 저장
            this.storage[callbackId] = fCallback;
            bizMOBCore.Module.logger(this.servicename, action, "L", " Callback storage saved the function at "+callbackId+" area.");
            break;
    }

    // 네이티브에 callbackId 전달하기 위해
    return callbackId;

};

/**
 * Callback 함수 호출
 *
 * @param Object oCallback	콜백 함수 정보 객체.
 * @param Object oResdata	콜백 함수로 전달될 데이타.
 *
 * @return
 */
bizMOBCore.CallbackManager.responser = function(oCallback, oResdata, oServiceInfo){
    // console.log("oCallback"+stringify(oCallback));
    // console.log("oResdata"+stringify(oResdata));
    // console.log("oServiceInfo"+stringify(oServiceInfo));

    // 네이티브가 callback 내려줄 때
    bizMOBCore.Module.logger(this.servicename, "responser", "L",  "CallbackManager recieve response from native : " );

    // 네이티브에서 오류나면 "exception"으로 replace
    if(oCallback.callback == "exception"){
        bizMOBCore.Module.logger(this.servicename, "responser", "E",  "Recieve Message is " + JSON.stringify(oResdata) );
        return;
    }

    if(oCallback.callback.indexOf("stg") == 0){

        bizMOBCore.Module.logger(this.servicename, "responser", "D", oCallback.callback + " call from the storage : " );
        this.storage[oCallback.callback](oResdata.message, oServiceInfo); // 네이티브에서 온 message와 함께 전달
        delete this.storage[oCallback.callback]; // 1회성
        bizMOBCore.Module.logger(this.servicename, "responser", "I", oCallback.callback+" function called and removed.");

    }else if(oCallback.callback.indexOf("lsn") == 0 || oCallback.callback.indexOf("cst") == 0){

        bizMOBCore.Module.logger(this.servicename, "responser", "D", oCallback.callback + " call from the listener : " );
        this.listener[oCallback.callback](oResdata.message, oServiceInfo);

    }else{

        // Device와 같이, script만 가지고 실행하는 경우
        bizMOBCore.Module.logger(this.servicename, "responser", "D", oCallback.callback + " call from the page : " );

        var tempcall

        try{
            tempcall = eval(oCallback.callback);
            tempcall.call(undefined, oResdata.message, oServiceInfo);
        }catch(e){
            if(tempcall == undefined ){
                bizMOBCore.Module.logger(this.servicename, "responser", "E", "Callback does not exist. : " + JSON.stringify(oCallback.callback));

            }else if(tempcall.constructor !== Function){
                bizMOBCore.Module.logger(this.servicename, "responser", "E", "Callback is not a function. : " + JSON.stringify(oCallback.callback));
            }
        }

    }

};


/**
 *
 * 01.클래스 설명 : bizMOBCore에서 사용할 공통 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : Callback 함수 관리 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Module = new Object();

bizMOBCore.Module.servicename = "Module";

//requester 상태 check하기 위한 cmdwatcher
bizMOBCore.Module.cmdwatcher = false;

bizMOBCore.Module.cmdPosition = 0;

/**
 * 파라미터 체크
 *
 * @param Object oParams	확인될 파라미터 정보 객체.
 * @param Array aRequired	필수 파라미터 목록.
 *
 * @return boolean result 파라미터 체크 결과
 */
bizMOBCore.Module.checkparam = function(oParams, aRequired){
    // param에 대해 옵션과 type지정이 올바르게 되었는지 확인
    var action = "checkparam";
    var result = true;
    var typeList = {
            "b" : Boolean ,
            "a" : Array,
            "s" : String ,
            "f" : Function ,
            "o" : Object ,
            "n" : Number ,
            "v" : "Variable",
            "e" : "Element"
    };

    if(oParams == undefined) {
        if(aRequired.length == 0){
            bizMOBCore.Module.logger(this.servicename, action ,"D", "Paramter is undefined.");
            return true;
        }else{
            bizMOBCore.Module.logger(this.servicename, action ,"D", "cannot found parameters.");
            return false;
        }
    }
    if(aRequired == undefined) { aRequired = []; }

    bizMOBCore.Module.logger(this.servicename, action ,"D", "Paramter is " + JSON.stringify(oParams));

    //Basic Check
    // oParams이 정의되어 있지 않거나, JSON Object가 아니면 false
    if(oParams == undefined || oParams.constructor != Object ) {
        bizMOBCore.Module.logger(this.servicename, action ,"E", "Invalid parameter format. Paramter have to define JSON.");
        return false;
    }


    for(var i =0; i< aRequired.length ; i++){
        //Required param Check
        if(oParams[aRequired[i]] == undefined ) {
            bizMOBCore.Module.logger(this.servicename, action ,"E", aRequired[i]+" parameter is required.");
            result = false;
            break;
        }
    }

    //Param Type Check
    for(var prop in oParams){

        if(oParams[prop] == undefined){
            bizMOBCore.Module.logger(this.servicename, action ,"L", prop+" parameter is undefined. it skip check");
        }else if(oParams[prop] == null) {
            bizMOBCore.Module.logger(this.servicename, action ,"L", prop+" parameter is null. it skip check.");
        }else{
            // key값 앞에 _s, _n...를 받아옴
            var paramtype = prop.substring(1,2);

            // 위에 선언한 typeList에 해당하지 않으면 false
            if(typeList[paramtype] == undefined) {
                bizMOBCore.Module.logger(this.servicename, action ,"E", prop+" parameter is unknown variable type.");
                result = false;
                break;
                // 1) array일 경우
            } else if(typeList[paramtype] == Array)	{
                for(var idx = 0; idx < aRequired.length; idx++)	{
                    if(aRequired[i] == prop && oParams[prop].length === 0)	{
                        bizMOBCore.Module.logger(this.servicename, action ,"E", prop+" is empty Array.");
                        result = false;
                        break;
                    }
                }
                // 2) array아닐경우
            } else if(oParams[prop].constructor !== typeList[paramtype] && typeList[paramtype] != "Variable" && typeList[paramtype] != "Element" ){
                bizMOBCore.Module.logger(this.servicename, action ,"E", prop+" parameter have wrong value.");
                result = false;
                break;
            }

        }
    }

    return result;
};

/**
 * Command Queue에서 저장된 커맨드 순서대로 Native에 요청
 *
 * @param
 *
 * @return
 */
bizMOBCore.Module.requester = function() {
    // 실제로 네이티브에 요청하는 부분
    var action = "requester";

    if(this.cmdQueue.length > this.cmdPosition){
        bizMOBCore.Module.logger(this.servicename , action, "D", (this.cmdPosition+1)+"th COMMAND Request.");
        document.location.href=this.cmdQueue[this.cmdPosition];
        this.cmdQueue[this.cmdPosition] = null;
        this.cmdPosition++;
        setTimeout("bizMOBCore.Module.requester();", 200);
    }else{
        console.log("COMMAND Stopped!!");
        this.cmdwatcher = false;
    }

};

/**
 * 각 서비스 별로 요청된 Command를 받아 MCNC Protocol 규격으로 Commnad Queue에 저장
 *
 * @param Object oMessage	Native에 전달될 파라미터 정보 객체.
 * @param String sServiceName	요청한 커맨드의 서비스명 정보.
 * @param String sAction	요청한 커맨드의 서비스내 기능 정보.
 * @param Object oServiceInfo	Native에 전달하고 Core 로직을 위한 파라미터 정보 객체.
 *
 * @return
 */
bizMOBCore.Module.gateway = function(oMessage, sServiceName, sAction, oServiceInfo){
    var action = "gateway";

    oMessage.service_info = {};

    if(oServiceInfo){
        oMessage.service_info = oServiceInfo;
    }

    oMessage.service_info["sServiceName"] = sServiceName;
    oMessage.service_info["sAction"] = sAction;

    // oMessage JSON object --> string으로 바꾸어 줌
    // replacer: 숫자를 string으로 변환해 줌(webkit에서 오류나서)

    oMessage = JSON.stringify(oMessage, this.replacer, 3);

    if( bizMOBCore.DeviceManager.isIOS()){

        bizMOBCore.Module.logger(this.servicename , action, "D", "Request Service : "+sServiceName);
        bizMOBCore.Module.logger(this.servicename , action, "D", "Request Action : "+sAction);
        bizMOBCore.Module.logger(this.servicename , action, "D", "Request Param : "+oMessage);

        window.webkit.messageHandlers.BMCManager.postMessage(oMessage);
    } else {

        bizMOBCore.Module.logger(this.servicename , action, "D", "Request Service : "+sServiceName);
        bizMOBCore.Module.logger(this.servicename , action, "D", "Request Action : "+sAction);
        bizMOBCore.Module.logger(this.servicename , action, "D", "Request Param : "+oMessage);

        window.BMCManager.execPluginWithJSB(oMessage);
    }

};

/**
 * 메세지 Data중 Command 요청시 오류가 발생하는 Data처리 함수
 *
 * @param String sKey	Data의 키값.
 * @param Variable vValue	변경할 데이터.
 *
 * @return vValue 가공된 데이터
 */
bizMOBCore.Module.replacer = function(sKey, vValue) {
    // 숫자를 string type으로 바꾸어 줌(number로 하면 오작동 하는 경우 발생)
    if (typeof vValue === 'number' && !isFinite(vValue)) {
        return String(vValue);
    }
    return vValue;
};

/**
 * JSON Object를 String으로 변환
 *
 * @param Variable vValue	변경할 데이터.
 *
 * @return value String으로 변환된 값.
 */
bizMOBCore.Module.stringjson = function(vValue) {
    // Object -> String
    var value =  vValue!=undefined && vValue!=null ? JSON.stringify(vValue) : "";
    return value;

};

/**
 *String을 JSON Object으로 변환
 *
 * @param Variable vValue	변경할 데이터.
 *
 * @return String vValue String으로 변환된 값.
 */
bizMOBCore.Module.parsejson = function(vValue) {
    // String -> Object
    var retValue;

    // 숫자를 다시 Object로 변환 할 때, 0으로 시작하면 8진수로 오작동 할 수 있으므로
    if ( vValue != undefined && vValue.slice(0, 1) != "0" && vValue != "" ) {
        retValue = JSON.parse(vValue);
    }

    return retValue;

};

/**
 *File 클래스내에서 FilePath지정시 지정위치 키워드 처리
 *
 * @param String sPath	변경할 FilePath 값.
 *
 * @return Object splitPathType FilePath 정보를 분할한 Data Object.
 */
bizMOBCore.Module.pathParser = function(sPath) {
    // native 인터페이스 parsing을 위해 경로 분리
    var splitPathType = {};
    var regExp = new RegExp("{(.*?)}/(.*)","g");
    var result = regExp.exec(sPath);

    if(result){
        // {contents}/bizMOB/sign.bmp
        // result[1]: {contents}
        // result[2]: bizMOB/sign.bmp
        splitPathType.type = result[1] ? result[1] : "absolute";
        splitPathType.path = result[2];
    }else {
        splitPathType.type = "absolute";
        splitPathType.path = sPath;
    }
    return splitPathType;
};

/**
 *Native 요청시 정의된 Callback함수가 없을경우 Default로 지정될 함수
 *
 * @param Object oReturnValue	Native로 부터 전달된 데이터 값.
 *
 * @return
 */
bizMOBCore.Module.echo = function(oReturnValue){
    // callback이 option일때 callback이 없으면 script에러 나서 echo callback만들어 줌
    var action = "echo";
    bizMOBCore.Module.logger("Module", action ,"L", "Echo callback . : ");
    if(oReturnValue.constructor !== Event){
        bizMOBCore.Module.logger("Module", action ,"D", "callback parameter . : "+ JSON.stringify(oReturnValue));
    }

};

/**
 * Log 출력
 *
 * @param String sServiceName	요청한 커맨드의 서비스명 정보.
 * @param String sAction	요청한 커맨드의 서비스내 기능 정보.
 * @param String sLogtype 로그 레벨
 * @param String sMessage 로그 메세지
 *
 * @return
 */
bizMOBCore.Module.logger = function(sService, sAction, sLogtype, sMessage){

    var logmsg = "["+sService+"]"+"["+sAction+"] - "+sMessage;
    logmsg = logmsg.replace(/\{/gi, "{\n").replace(/\}/gi, "}\n").replace(/\\"/gi, "");

    var logLevel = bizMOB.Device.Info ? bizMOB.Device.Info.web_log_level:bizMOBCore.loglevel;

    if(typeof logLevel == "string" && logLevel.length==4){
        var logLevelArr = logLevel.split("");
        switch(sLogtype){
        case "I" :
        case "L" :
            if(logLevelArr[0].indexOf("1") > -1){
                console.log("bizMOB LOG :"+logmsg);
            }
            break;
        case "D" :
            if(logLevelArr[1].indexOf("2") > -1){
                console.debug("bizMOB DEBUG:"+logmsg);
            }
            break;
        case "W" :
            if(logLevelArr[2].indexOf("4") > -1){
                console.log("bizMOB WARN :"+logmsg);
            }
            break;
        case "E" :
            if(logLevelArr[3].indexOf("8") > -1){
                console.error("bizMOB ERROR : "+logmsg);
                console.trace();
                throw("bizMOB error. stop process");
            }
            break;
        }
    }
};

/**
 * Core 초기화 작업
 *
 * @param Object oRequired 발생 이벤트 Data객체
 * @param Object oOptions 이벤트에 전달될 메세지 Data객체
 *
 * @return
 */
bizMOBCore.Module.init = function(oRequired, oOptions){

    var action = "init";

    // bizMOBCore.APP_CONFIG = $.ajax({ "url" : "../../bizMOB/config/app.config", "async" : false, "cache" : false, "dataType" : "JSON" }).responseJSON;

    // bizMOBCore.DeviceManager.init();
    // bizMOBCore.Module.logger(this.servicename, action ,"L", "bizMOB DeviceManager initialized. ");
    // bizMOBCore.EventManager.init();
    // bizMOBCore.Module.logger(this.servicename, action ,"L", "bizMOB EventManager initialized. ");

    // bizMOBCore.Module.logger(this.servicename, action ,"L", "bizMOB Module initialized. ");

    /**
     * initXross에서 필요 값 셋팅으로 변경
     * - 제이쿼리 제거로 인한 $.ajax 제거
     */
    bizMOBCore.DeviceManager.init();
    bizMOBCore.Module.logger(this.servicename, action ,"L", "bizMOB DeviceManager initialized. ");
    bizMOBCore.EventManager.init();
    bizMOBCore.Module.logger(this.servicename, action ,"L", "bizMOB EventManager initialized. ");

    bizMOBCore.Module.logger(this.servicename, action ,"L", "bizMOB Module initialized. ");

};

/**
 * 01.클래스 설명 : bizMOB Window 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 :  bizMOB Client에서 생성하는 Window 객체
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Window = new Object();

bizMOBCore.Window.servicename = "Window";

// 모듈 config 변수
bizMOBCore.Window.config = {};

// 모듈 config init 함수
bizMOBCore.Window.init = function(config) {
    var setting = bizMOBCore.Window.config;
    bizMOBCore.Window.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * SignPad(서명) Window 띄우기
 *
 * @param String _sTargetPath		사인패드에서 서명한 이미지를 저장할 File Path.
 * @param Function _fCallback		사인패드 처리 결과값을 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.Window.openSignPad = function() {

    var action = "openSignPad";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);

    var oldparam = {
        target_path_type : splitTargetPath.type,
        target_path : splitTargetPath.path,
        callback:callback
    };

    var tr = {
        id:"GOTO_SIGNATURE",
        param:{}
    };

    var params = Object.assign({}, {
        callback: "bizMOBCore.Module.echo"
    }, oldparam);

    tr.param = params;

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * File Explorer(탐색기) Window 띄우기
 *
 *
 * @return Object File 정보 객체
 */
bizMOBCore.Window.openFileExplorer = function() {

    var action = "openFileExplorer";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
            id:"OPEN_FILE_BROWSER",
            param:{
                "callback" : callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * ImageViewer  띄우기
 *
 * @param String _sImagePath	이미지 뷰어로 열 이미지 File Path.
 * @param Function _fCallback	 이미지 뷰어 Close시 결과값을 받을 callback함수.
 *
 * @return
 */
bizMOBCore.Window.openImageViewer = function() {

    var action = "openImageViewer";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sImagePath);

    var oldparam = {
        "source_path" : splitSourcePath.path,
        "source_path_type" : splitSourcePath.type,
        "orientation" : "auto",
        callback : callback
    };

    var tr = {
        id:"SHOW_IMAGE_VIEW",
        param:{}
    };

    var params = Object.assign({}, {
        callback: "bizMOBCore.Module.echo"
    }, oldparam);

    tr.param = params;

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * CodeReader( BarCode, QRCode )  띄우기
 *
 * @param Function _fCallback	 Code 판독 결과값을 받을 callback함수.
 *
 * @return
 */
bizMOBCore.Window.openCodeReader = function() {

    var action = "openCodeReader";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var oldparam = {
        callback:callback
    };

    var tr = {
        id:"QR_AND_BAR_CODE",
        param:{}
    };

    var params = Object.assign({}, {
        message:{},
        callback: "bizMOBCore.Module.echo"
    }, oldparam);

    tr.param = params;

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : Properties 저장 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : 영구 데이터 저장소
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Properties = new Object();

bizMOBCore.Properties.servicename = "Properties";

// 모듈 config 변수
bizMOBCore.Properties.config = {};

// 모듈 config init 함수
bizMOBCore.Properties.init = function(config) {
    var setting = bizMOBCore.Properties.config;
    bizMOBCore.Properties.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * Properties 데이터 저장
 *
 * @param Variable _aList또는_sKey 저장할 데이터
 * @param Variable _vValue 저장할 값(_sKey와 쌍으로 들어옴.)
 *
 * @return
 */
bizMOBCore.Properties.set = function() {

    var action = "set";
    var tr = {
            call_type:"js2stg",
            id:"SET_FSTORAGE",
            param:{data:[]}
    };

    // native한테 주기 전에 데이터 정리하는 용도의 array
    var properties = [];

    if(arguments[0]._aList)
    {
            var savelist = arguments[0]._aList;
            for(var i=0;i < savelist.length ; i++){

                properties.push({key:savelist[i]._sKey, value:bizMOBCore.Module.stringjson(savelist[i]._vValue)});
                // set하고 바로 get하고 싶을 때(개발자 입장에서 로직에따라)
                bizMOB.FStorage[savelist[i]._sKey] = bizMOBCore.Module.stringjson(savelist[i]._vValue);
            }
    }else{
            properties.push({key:arguments[0]._sKey, value:bizMOBCore.Module.stringjson(arguments[0]._vValue)});
            bizMOB.FStorage[arguments[0]._sKey] = bizMOBCore.Module.stringjson(arguments[0]._vValue);
    }

    tr.param.data = properties;
    bizMOBCore.Module.logger(this.servicename, action ,"D", arguments[0]._sKey+ " set on bizMOB Properties. ");

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * Properties 데이터 불러오기
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Properties.get = function() {
    var action = "get";
    var key = arguments[0]._sKey;

    // native에 요청 없이 FStorage에서 get
    return bizMOBCore.Module.parsejson( bizMOB.FStorage[key]);

};

/**
 * Properties 데이터 삭제
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Properties.remove = function() {
    var action = "remove";
    var key = arguments[0]._sKey;

    // Native에서 지우기
    var tr = {
        id:"REMOVE_FSTORAGE",
        param:{data:[key]}
    };
    // FStorage에서 지우기
    delete bizMOB.FStorage[key];


    bizMOBCore.Module.logger(this.servicename, action ,"D", arguments[0]._sKey+ " removed on bizMOB Properties. ");

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 *
 * 01.클래스 설명 : System 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : OS 기반 기본 기능
 * 04.관련 API/화면/서비스 : bizMOBCore.Module.checkparam,bizMOBCore.System.callBrowser, bizMOBCore.System.callCamera, bizMOBCore.System.callGallery, bizMOBCore.System.callMap, bizMOBCore.System.callSMS, bizMOBCore.System.callTEL, bizMOBCore.System.getGPS
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.System = new Object();

bizMOBCore.System.servicename = "System";

// 모듈 config 변수
bizMOBCore.System.config = {};

// 모듈 config init 함수
bizMOBCore.System.init = function(config) {
    var setting = bizMOBCore.System.config;
    bizMOBCore.System.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * 전화걸기
 *
 * @param String _sNumber	전화번호
 * @param Function _fCallback	실행후 결과를 처리할 callback 함수
 *
 * @return
 */
bizMOBCore.System.callTEL = function() {

    var action = "callTEL";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id:"TEL",
        param:{
            number:arguments[0]._sNumber,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 문자보내기
 *
 * @param Array _aNumber	메세지를 보낼 전화번호 배열
 * @param String _sMessage	보낼 메세지
 * @param Function _fCallback	실행후 결과를 처리할 callback 함수
 *
 * @return
 */
bizMOBCore.System.callSMS = function() {

    var action = "callSMS";
    //var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var cell_list = arguments[0]._aNumber;

    for(var i=0; i< cell_list.length ; i++)
    {
        var validvalue = cell_list[i].match(/(^[+0-9])|[0-9]/gi);
        if(validvalue != null){
            cell_list[i] = validvalue.join("");
        }else{
            bizMOBCore.Module.logger(this.servicename, action ,"E", cell_list[i]+ " is wrong number format.");
        }
    }

    arguments[0]._aNumber = cell_list;

    var tr = {
        id:"SMS",
        // ;로 구분해서 string으로 보냄
        param:{number:arguments[0]._aNumber.join(";"), message:arguments[0]._sMessage}
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 단말기에 설치된 브라우져 열기
 *
 * @param String _sURL	메세지를 보낼 전화번호 배열
 *
 * @return
 */
bizMOBCore.System.callBrowser = function(){

    var action = "callBrowser";

    var tr = {

        id:"SHOW_WEBSITE",
        param:{ "url":arguments[0]._sURL }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 단말기 디바이스의 갤러리(사진앨범) 보기
 *
 * @param String _sType	String	(Default : all) 갤러리에서 불러올 미디어 타입( all, image, video )가 있습니다.
 * @param Function _fCallback	갤러리에서 선택한 미디어를 결과를 전달 받아서 처리할 callback 함수.

 *
 * @return
 */
bizMOBCore.System.callGallery = function(){

    var action = "callGallery";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
            id:"OPEN_MEDIA_PICKER",
            param:{
                type_list : arguments[0]._sType,
                callback:callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 단말기 지도 실행
 *
 * @param String _sLocation	위치 정보(주소, 위경도값)
 *
 * @return
 */
bizMOBCore.System.callMap = function() {

    var action = "callMap";

    var tr = {
        id:"SHOW_MAP",
        param:{
            location:arguments[0]._sLocation
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * OS별 지도 실행
 *
 * @param String _sLocation	위치 정보(주소, 위경도값)
 *
 * @return
 */
bizMOBCore.System.getGPS = function()
{
    var action = "getGPS";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
            id:"GET_LOCATION",
            param:{
                callback:callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 단말기 카메라 촬영
 *
 * @param Function _fCallback		갤러리에서 선택한 미디어를 전달 받아서 처리하는 callback 함수
 * @param String _sFileName		찍은 이미지를 저장할 이름
 * @param String _sDirectory	찍은 이미지를 저장할 경로
 * @param Boolean _bAutoVerticalHorizontal	(Default : true) 찍은 이미지를 화면에 맞게 자동으로 회전시켜 저장할지를 설정 값
 *
 * @return
 */
bizMOBCore.System.callCamera = function()
{
    var action = "callCamera";

    var splitTargetDir = bizMOBCore.Module.pathParser(arguments[0]._sDirectory);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    // bAutoVerticalHorizontal: 사진을 자동으로 가로 세로 맞춰주는 옵션
    var autoVerticalHorizontal = arguments[0]._bAutoVerticalHorizontal === false ? false : true;

    var tr = {
            id:"CAMERA_CAPTURE",
            param:{
                target_directory: splitTargetDir.path,
                target_directory_type: splitTargetDir.type,
                picture_name:arguments[0]._sFileName,
                rotate : autoVerticalHorizontal,
                callback : callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 *
 * 01.클래스 설명 : App 컨트롤 관련 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : App 컨트롤 관련 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.App = new Object();

bizMOBCore.App.servicename = "App";

// 모듈 config 변수
bizMOBCore.App.config = {
    _sAppKey: "", // AppKey
    _bIsRelease: false, // 운영 빌드 여부
};

// 모듈 config init 함수
bizMOBCore.App.init = function(config) {
    var setting = bizMOBCore.App.config;
    bizMOBCore.App.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * App 프로그래스바 열기
 *
 * @param Function _fCallback	실행 후 호출될 callback 함수
 *
 * @return
 */
bizMOBCore.App.openProgress = function(){

    var action = "openProgress";
    if(arguments[0] == undefined) { arguments[0] = {}; }
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        "id": "PROGRESS_CONTROLLER",
        "param": {
            "type" : "show" ,
            "callback" : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 프로그래스바 닫기
 *
 *@param Function _fCallback	실행 후 호출될 callback 함수
 *
 * @return
 */
bizMOBCore.App.closeProgress = function(){

    var action = "closeProgress";
    if(arguments[0] == undefined) { arguments[0] = {}; }
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        "id": "PROGRESS_CONTROLLER",
        "param": {
            "type" : "close" ,
            "callback" : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 종료
 *
 * @param String _sType	(Default : kill)어플리케이션 종료 유형( logout 또는 kill )
 *
 * @return
 */
bizMOBCore.App.exit = function(){

    var action = "exit";

    var tr = {
        "id": "APPLICATION_EXIT",
        "param": {"kill_type" : arguments[0]._sType }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * App 자동 종료 시간 설정/조회
 *
 * @param Number _nSeconds	( default : 7200 )어플리케이션의 세션 만료 시간(초단위) 설정 값.
 * @param Variable _vMessage 세션 종료시 표시할 메세지
 *
 * @return
 */
bizMOBCore.App.requestTimeout = function(){

    var action = "requstTimeout";

    var callback = arguments[0]._fCallback ? bizMOBCore.CallbackManager.save(arguments[0]._fCallback) : "" ;

    var tr = {
        "id": "SET_SESSION_TIMEOUT",
        "param": {
            "callback":callback,
            "session_timeout": arguments[0]._nSeconds,
            "message": arguments[0]._vMessage
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : Web Storage 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : 휘발성 데이터 저장소
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Storage = new Object();

bizMOBCore.Storage.servicename = "Storage";

// 모듈 config 변수
bizMOBCore.Storage.config = {};

// 모듈 config init 함수
bizMOBCore.Storage.init = function(config) {
    var setting = bizMOBCore.Storage.config;
    bizMOBCore.Storage.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};


/**
 * Storage 데이터 저장
 *
 * @param Variable _aList또는_sKey 저장할 데이터
 * @param Variable _vValue 저장할 값(_sKey와 쌍으로 지정됨)
 *
 * @return
 */
bizMOBCore.Storage.set = function() {

    var action = "set";

    // 1. Array로 올 때
    if(arguments[0]._aList)
    {		var savelist = arguments[0]._aList;
            for(var i=0;i < savelist.length ; i++){
                // HTML5에 있는 localStorage에 저장
                // storage는 브라우저 web storage
                localStorage.setItem ( savelist[i]._sKey ,  bizMOBCore.Module.stringjson(savelist[i]._vValue) );
            }
    // 2. Key value로 들어 올 때
    }else{
            localStorage.setItem ( arguments[0]._sKey ,  bizMOBCore.Module.stringjson(arguments[0]._vValue) );
    }

    bizMOBCore.Module.logger(this.servicename, action ,"D", arguments[0]._sKey+ " set on bizMOB Storage. ");


};

/**
 * Storage 데이터 불러오기
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Storage.get = function() {

    var action = "get";
    var key = arguments[0]._sKey;

    var value = localStorage.getItem ( key );

    return bizMOBCore.Module.parsejson(value);
};

/**
 * Storage 데이터 삭제
 *
 * @param String _sKey 저장 값의 키
 *
 * @return
 */
bizMOBCore.Storage.remove = function() {

    var action = "remove";

    localStorage.removeItem(arguments[0]._sKey);

    bizMOBCore.Module.logger(this.servicename, action ,"D", arguments[0]._sKey+ " removed on bizMOB Storage. ");

};


/**
 *
 * 01.클래스 설명 : Network 통신 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : bizMOB Server와 통신
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Network = new Object();

bizMOBCore.Network.servicename = "Network";

// 모듈 config 변수
bizMOBCore.Network.config = {
    _sBaseUrl: "", // Client Base Url
    _sContext: "", // Client Context
};

// 모듈 config init 함수
bizMOBCore.Network.init = function(config) {
    var setting = bizMOBCore.Network.config;
    bizMOBCore.Network.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

bizMOBCore.Network.index = 0;

bizMOBCore.Network.callbackStorage = {};

bizMOBCore.Network.TrStorage = {};

/**
 * bizMOB Server 전문목록 요청 결과 처리 제어
 *
 * @param Object result	서버와 통신 후 결과
 * @param Object service_info	bizMOB Server 전문 요청 인증 전문 리스트
 *
 * @return
 */
bizMOBCore.Network.listResponser = function( result, service_info ){

    console.log("++++++++++++++++++++++++++Responser service_info.listKey++++++++++++++"+service_info.listKey);
    console.log("++++++++++++++++++++++++++Responser service_info++++++++++++++"+JSON.stringify(service_info));
    try{
        bizMOBCore.Network.TrStorage[service_info.listKey].trResult.push(result);
        bizMOBCore.Network.listRequester(service_info.listKey );

    }catch(e){

        bizMOBCore.App.closeProgress();
        bizMOBCore.Module.logger(service_info.sServiceName , service_info.sAction, "D", service_info.listKey+" Request Failed.");
        bizMOBCore.Module.logger(service_info.sServiceName , service_info.sAction, "E", JSON.stringify(e) );

    }

}

/**
 * bizMOB Server 전문목록 요청
 *
 * @param String listKey	bizMOB Server 목록 요청키
 *
 * @return
 */
bizMOBCore.Network.listRequester = function(listKey){

    var action = "listRequester";
    var TrStorage = bizMOBCore.Network.TrStorage;

    if( TrStorage[listKey] && TrStorage[listKey].trList.length > 0 ){

        var tr = this.makeTr(TrStorage[listKey].trList[0]);
        var callbackid =  bizMOBCore.CallbackManager.save(bizMOBCore.Network.listResponser);

        tr.param.callback = callbackid;

        TrStorage[listKey].trList = TrStorage[listKey].trList.bMRemoveAt(0);


        var service_info = {
            "listKey" : listKey
        }

        bizMOBCore.Module.gateway(tr, this.servicename , action, service_info );

    }else{

        bizMOBCore.App.closeProgress()

        bizMOBCore.CallbackManager.responser(
                { "callback" : TrStorage[listKey].callback },
                { "message" : TrStorage[listKey].trResult }
        );

    }


}

/**
 * bizMOB Server 전문 통신
 *
 * @param Array _aTrList	bizMOB Server 인증 전문 리스트
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBCore.Network.requestTrList = function() {

    var action = "requestTrList";

    try{

        bizMOBCore.App.openProgress();

        var listKey = action+this.index;
        this.index++;

        this.TrStorage[listKey] = {};
        this.TrStorage[listKey].trResult = [];
        this.TrStorage[listKey].trList = arguments[0]._aTrList;
        this.TrStorage[listKey].callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

        bizMOBCore.Module.logger(this.servicename , action, "D", arguments[0]._aTrList.length+" Request Reserved.");

        this.listRequester(listKey, action);

    }catch(e){

        bizMOBCore.App.closeProgress();
        bizMOBCore.Module.logger(this.servicename , action, "D", arguments[0]._aTrList.length+" Request Failed.");
    }
};

/**
 * bizMOB Server 전문 생성
 *
 * @param String _sTrcode	bizMOB Server 전문코드
 * @param String _oHeader	bizMOB Server 전문 Header 객체
 * @param String _oBody		bizMOB Server 전문 Body 객체
 * @param Boolean _bProgressEnable		(default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBCore.Network.makeTr = function(){

    var TR_HEADER = {
            "result" : true,
            "error_code" : "",
            "error_text" : "",
            "info_text" : "",
            "message_version" : "",
            "login_session_id" : "",
            "trcode" : arguments[0]._sTrcode
        };

        var TR_BODY = {};

        var header = Object.assign({},TR_HEADER , arguments[0]._oHeader);
        var body = Object.assign({},TR_BODY , arguments[0]._oBody);

        var tr = {

            id:"REQUEST_TR",
            param:{}
        };

        var params ={
            trcode : arguments[0]._sTrcode,
            message:{ header: header , body : body },
            read_timeout : 60*1000,
            progress : false
        };

        tr.param = params;

        return tr;
};

/**
 * bizMOB Server 전문 통신
 *
 * @param String _sTrcode	bizMOB Server 전문코드
 * @param String _oHeader	bizMOB Server 전문 Header 객체
 * @param String _oBody		bizMOB Server 전문 Body 객체
 * @param Boolean _bProgressEnable		(default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 *
 * @return
 */
bizMOBCore.Network.requestTr = function(arg) {
    var timeout = 60 * 1000;

    // Mock 데이터 호출이거나, Web인 경우 Http 모듈 호출
    if (arguments[0]._bMock || bizMOBCore.DeviceManager.isWeb()) {
        var url = (bizMOBCore.Network.config._sContext === "/" ? "" : bizMOBCore.Network.config._sContext) + "/" + arg._sTrcode + ".json";

        /** Body 셋팅 */
        var message = {
            header: Object.assign({}, {
                result: true,
                error_code: "",
                error_text: "",
                info_text: "",
                message_version: "",
                login_session_id: "",
                trcode: arg._sTrcode
            }, arg._oHeader),
            body: arg._oBody
        };
        var method = "POST";
        var body = {
            message: JSON.stringify(message)
        };

        /** Mock 조회 셋팅 */
        if (!bizMOBCore.App.config._bIsRelease && arg._bMock) {
            url = bizMOBCore.Network.config._sBaseUrl + "mock/" + arg._sTrcode + ".json?" + body;
            method = "GET";
        }

        /** 서버 통신 */
        var option = {
            method: method,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: method === "POST" ? new URLSearchParams(body || {}).toString() : undefined,
            mode: "cors", // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        };

        bizMOBCore.Http.fetch(url, option, timeout)
            .then(function(res) {
                arg._fCallback && arg._fCallback(res.data);
            })
            .catch(function() {
                arg._fCallback && arg._fCallback({
                    header: Object.assign({}, {
                        result: false,
                        error_code: 'NE0002',
                    }, message.header),
                });
            });
    }
    else {
        var action = "requestTr";

        var TR_HEADER = {
            "result" : true,
            "error_code" : "",
            "error_text" : "",
            "info_text" : "",
            "message_version" : "",
            "login_session_id" : "",
            "trcode" : arg._sTrcode
        };
        var TR_BODY = {};

        // progress 진행 표시
        var progressEnable = arg._bProgressEnable === false ? false : true;

        var tr = {
            id: "REQUEST_TR",
            param: {
                trcode : arg._sTrcode,
                message:{
                    header: Object.assign({}, TR_HEADER , arg._oHeader),
                    body : Object.assign({}, TR_BODY , arg._oBody)
                },
                callback: bizMOBCore.CallbackManager.save(arg._fCallback),
                read_timeout : timeout,
                progress : progressEnable
            }
        };

        bizMOBCore.Module.gateway(tr, this.servicename , action );
    }
};

/**
 * bizMOB Server 로그인(인증)전문 통신
 *
 * @param String _sUserId	인증 받을 사용자 아이디
 * @param String _sPassword	인증 받을 사용자 패스워드
 * @param String _sTrcode	레거시 로그인 인증 전문코드
 * @param String _oHeader	레거시 로그인 인증 전문 Header 객체
 * @param String _oBody		레거시 로그인 인증 전문 Body 객체
 * @param Function _fCallback	서버와 통신 후 실행될 callback 함수
 * @param Boolean _bProgressEnable		(default:true) 서버에 통신 요청시 progress 표시 여부( true 또는 false )
 *
 * @return
 */
bizMOBCore.Network.requestLogin = function(arg) {
    var timeout = 10 * 1000;

    // Mock 데이터 호출이거나, Web인 경우 Http 모듈 호출
    if (arg._bMock || bizMOBCore.DeviceManager.isWeb()) {
        /** Body 셋팅 */
        var url = (bizMOBCore.Network.config._sContext === "/" ? "" : bizMOBCore.Network.config._sContext) + "/LOGIN.json";
        var message = {
            header: {
                trcode: 'LOGIN',
            },
            body: {
                user_id: arg._sUserId,
                os_type: 'web',
                legacy_message: {
                    header: Object.assign({}, {
                        result: true,
                        error_code: "",
                        error_text: "",
                        info_text: "",
                        message_version: "",
                        login_session_id: "",
                        trcode: arg._sTrcode
                    }, arg._oHeader),
                    body: arg._oBody
                },
                legacy_trcode: arg._sTrcode,
                password: arg._sPassword,
                app_key: bizMOBCore.App.config._sAppKey ? bizMOBCore.App.config._sAppKey : "",
                emulator_flag: true,
                manual_phone_number: false,
                device_id: '',
                phone_number: '',
            },
        };
        var method = "POST";
        var body = {
            message: JSON.stringify(message)
        };

        /** Mock 조회 셋팅 */
        if (!bizMOBCore.App.config._bIsRelease && arg._bMock) {
            url = bizMOBCore.Network.config._sBaseUrl + "mock/" + arg._sTrcode + ".json?" + body;
            method = "GET";
        }

        /** 서버 통신 */
        var option = {
            method: method,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: method === "POST" ? new URLSearchParams(body || {}).toString() : undefined,
            mode: "cors", // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        };

        bizMOBCore.Http.fetch(url, option, timeout)
            .then(function(res) {
                arg._fCallback && arg._fCallback(res.data);
            })
            .catch(function() {
                arg._fCallback && arg._fCallback({
                    header: Object.assign({}, {
                        result: false,
                        error_code: 'NE0002',
                    }, message.header),
                });
            });
    }
    else {
        var action = "requestLogin";

        var TR_HEADER = {
            "result" : true,
            "error_code" : "",
            "error_text" : "",
            "info_text" : "",
            "message_version" : "",
            "login_session_id" : "",
            "trcode" : arg._sTrcode
        };
        var TR_BODY = {};

        var progressEnable = arg._bProgressEnable === false ? false : true;

        var tr = {
            id:"REQUEST_LOGIN",
            param: {
                // portal에 로그인
                auth_info: {
                    user_id: arg._sUserId,
                    password: arg._sPassword
                },
                // 확장
                legacy_trcode: arg._sTrcode,
                legacy_message: {
                    header: Object.assign({},TR_HEADER , arg._oHeader),
                    body : Object.assign({},TR_BODY , arg._oBody)
                },
                message: {},
                callback: bizMOBCore.CallbackManager.save(arg._fCallback),
                read_timeout : timeout,
                progress : progressEnable
            }
        };

        bizMOBCore.Module.gateway(tr, this.servicename , action );
    }
};

/**
 *
 * 01.클래스 설명 : Event 관리 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : bizMOB Event  관리 기능 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.EventManager = new Object();

bizMOBCore.EventManager.servicename = "EventManager";

bizMOBCore.EventManager.storage = {
        // 페이지 관련
        "ready" : ["page.init"],
        "resume" : [],
        "backbutton" : [],
        "beforeready" : [],
        // 사이드 뷰 관련
        "open" : [],
        "close" : [],
        // 푸시 메시지 관련
        "push" : [],
        "networkstatechange" : []
};

bizMOBCore.EventManager.list = ["ready","resume","backbutton","open","close","networkstatechange"];

/**
 * bizMOB Window Load시 bizMOB Event 기능 초기화
 *
 * @param
 *
 * @return
 */
bizMOBCore.EventManager.init = function() {

    var action = "init";
    var backYn = false;  // close event default

    for (var evtname in this.storage) {

        var evtlist = bizMOBCore.EventManager.storage[evtname];

        for(var i=0; i < evtlist.length;i++){

            bizMOBCore.Module.logger(this.servicename, action ,"D", evtname+" event add start. Listener is "+evtlist[i]);
            // String -> Object화 (return value: function)
            var evtlistener = eval(evtlist[i]);

            if(evtlistener ){

                if(evtlistener.constructor === Function){

                    if(evtname == "backbutton" && bizMOBCore.DeviceManager.isAndroid()) { backYn = true; }

                    document.addEventListener("bizMOB.on"+evtname, evtlistener, false);
                    bizMOBCore.Module.logger(this.servicename, action ,"D", evtlist[i]+" has been added in the "+evtname+" event. ");

                }else{
                    bizMOBCore.Module.logger(this.servicename, action ,"W", evtlist[i]+" cannot added in the "+evtname+" event. it is not a function.");
                }

            }else{
                bizMOBCore.Module.logger(this.servicename, action ,"W",  evtlist[i]+" is undefined. ");
            }


        }

    }

    // native에 backbutton에 대한 event 추가 요청
    if(backYn){
        bizMOBCore.EventManager.requester({ "eventname" : "backbutton" });
    }

    bizMOBCore.Module.logger(this.servicename, action ,"L", "EventManager initialized.");

};

/**
 * Native에서 관장하는 Event  등록 요청 기능
 *
 * @param Object oRequired 요청 이벤트 Data객체
 * @param Object oOptions 요청 이벤트 등록 요청시 전달할 Data객체
 *
 * @return
 */
bizMOBCore.EventManager.requester = function(oRequired, oOptions) {

    var action = "requester";

    switch(oRequired.eventname)
    {
        case "backbutton" :

            var tr = {

                    id:"HARDWARE_BACKBUTTON",
                    param:{}
            };


            var params ={
                  useBackEvent : true,
            };

            tr.param = params;

            // native gateway에 요청
            bizMOBCore.Module.gateway(tr, this.servicename , action );
            bizMOBCore.Module.logger(this.servicename, action ,"L", "EventManager request add event.");

            break;
    }

};

/**
 * Native에서 Event 발생시 Web으로 전달되는 기능
 *
 * @param Object oRequired 발생한 이벤트 Data객체
 * @param Object oOptions 이벤트에 전달될 메세지 Data객체
 *
 * @return
 */
bizMOBCore.EventManager.responser = function(oRequired, oOptions) {
    // 네이티브에게 응답을 받기위한 용도
    // 네이티브에서 로직처리 완료 후 responser를 호출

    var action = "responser";

    bizMOBCore.Module.logger(this.servicename, action ,"L", "EventManager recieved event.");
    bizMOBCore.Module.logger(this.servicename, action ,"D", "Event Name : " + oRequired.eventname);
    bizMOBCore.Module.logger(this.servicename, action ,"D", "Event Data : " + JSON.stringify(oOptions));

    switch(oRequired.eventname)
    {
        // 네이티브에서 준비되면 onReady
        case "onReady" :
            if(!bizMOBCore.readystatus){
                // 웹 레디 준비(Module.init에서 device property랑 이벤트 등록해줌)
                bizMOBCore.Module.init(oRequired, oOptions);
                bizMOBCore.readystatus = true;
                // beforeready 호출(beforeready: 페이지가 로딩 전에 수행되어야하는 로직들)
                bizMOBCore.EventManager.raiseevent({eventname : "onbeforeready"}, oOptions);
                // onReady불러줌 onReady에 page.init
                bizMOBCore.EventManager.raiseevent(oRequired, oOptions);
            }
            break;
        // 일반적인 이벤트
        default :
            bizMOBCore.EventManager.raiseevent(oRequired, oOptions);
            break;
    }

};

/**
 * 등록된 이벤트를 발생 시키는 기능
 *
 * @param Object oRequired 발생한 이벤트 Data객체
 * @param Object oOptions 이벤트에 전달될 메세지 Data객체
 *
 * @return
 */
bizMOBCore.EventManager.raiseevent = function(oRequired, oOptions) {
    // 이벤트 발생
    var action = "raiseevent";

    bizMOBCore.Module.logger(this.servicename, action ,"L", "EventManager raise event.");
    bizMOBCore.Module.logger(this.servicename, action ,"D", "Event Name : "+oRequired.eventname.toLowerCase());
    bizMOBCore.Module.logger(this.servicename, action ,"D", "Event Message : "+JSON.stringify(oOptions.message));

    // 자바스크립트 custom이벤트 발생
    var evt = document.createEvent("Event");
    evt.initEvent("bizMOB."+oRequired.eventname.toLowerCase(), false, true );
    // 이전페이지에서 온 message를 data에 넣어줌
    evt.data = oOptions.message;

    try{
        document.dispatchEvent(evt);
    }catch(e){
        bizMOBCore.Module.logger(this.servicename, action ,"E", e);
    }

};

/**
 *
 * 01.클래스 설명 : 단말기 정보 관리 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : 단말기 정보 관리
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.DeviceManager = new Object();

bizMOBCore.DeviceManager.servicename = "DeviceManager";

/**
 * bizMOB Window Load시 bizMOB Device Info 초기화
 *
 * @param
 *
 * @return
 */
bizMOBCore.DeviceManager.init = function(){
    // Device Info관련
    bizMOB.Device.Info.app_version += bizMOB.Device.Info.app_major_version + ".";
    bizMOB.Device.Info.app_version += bizMOB.Device.Info.app_minor_version + ".";
    bizMOB.Device.Info.app_version += bizMOB.Device.Info.app_build_version + "_";

    bizMOB.Device.Info.app_version += bizMOB.Device.Info.content_major_version + ".";
    bizMOB.Device.Info.app_version += bizMOB.Device.Info.content_minor_version;

    if(bizMOB.Device.Info.web_log_level) {
        bizMOB.loglevel =  bizMOB.Device.Info.web_log_level;
    }

    bizMOBCore.Module.logger(this.servicename, "init", "D", "Device Info initialized - "+JSON.stringify(bizMOB.Device.Info));
};

/**
 * App 판단 여부
 */
bizMOBCore.DeviceManager.isApp = function() {
    return !!window.BMCManager || (window.webkit ? (window.webkit.messageHandlers ? (window.webkit.messageHandlers.BMCManager ? true : false) : false) : false);
};

/**
 * Web 판단 여부
 */
bizMOBCore.DeviceManager.isWeb = function() {
    return !bizMOBCore.DeviceManager.isApp();
};

/**
 * Mobile 여부
 */
bizMOBCore.DeviceManager.isMobile = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return UA && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA);
};

/**
 * PC 여부
 */
bizMOBCore.DeviceManager.isPC = function() {
    return !bizMOBCore.DeviceManager.isMobile();
};

/**
 * Android 여부
 */
bizMOBCore.DeviceManager.isAndroid = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /android/i.test(UA);
};

/**
 * IOS 여부
 */
bizMOBCore.DeviceManager.isIOS = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(UA) && !window.MSStream;
};

/**
 * Tablet 여부
 */
bizMOBCore.DeviceManager.isTablet = function() {
    var UA = navigator.userAgent || navigator.vendor || window.opera;
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(UA.toLowerCase());
};

 /**
 * Phone 여부
 */
bizMOBCore.DeviceManager.isPhone = function() {
    return bizMOBCore.DeviceManager.isMobile() && bizMOBCore.DeviceManager.isTablet();
};


bizMOBCore.ExtendsManager = new Object();

bizMOBCore.ExtendsManager.servicename = "Extends";

bizMOBCore.ExtendsManager.executer = function(){

    var action = "executer";

    var required = new Array("_sID");

    if(!bizMOBCore.Module.checkparam(arguments[0], required)) {
        return;
    }

    bizMOBCore.Module.logger(this.servicename, action, "D", " ID : "+JSON.stringify(arguments[0]._sID));
    bizMOBCore.Module.logger(this.servicename, action, "D", " Parameter : "+JSON.stringify(arguments[0]._oParam));

    for(var prop in arguments[0]._oParam ){
        if(arguments[0]._oParam[prop].constructor === Function ){
            var callback = bizMOBCore.CallbackManager.save(arguments[0]._oParam[prop]);
            arguments[0]._oParam[prop] = callback;
        }
    }

    var tr = {
            id: arguments[0]._sID,
            param:arguments[0]._oParam
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : 단말기 주소록 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : 단말기 주소록 관리 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Contacts = new Object();

bizMOBCore.Contacts.servicename = "Contacts";

// 모듈 config 변수
bizMOBCore.Contacts.config = {};

// 모듈 config init 함수
bizMOBCore.Contacts.init = function(config) {
    var setting = bizMOBCore.Contacts.config;
    bizMOBCore.Contacts.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};


/**
 * 전화번호부 검색
 *
 * @param String _sSearchType	(Default : "", 전체조회) 주소록 검색 대상 필드(name 또는 phone)
 * @param String _sSearchText 	(Default : "") 주소록 검색어
 * @param Function _fCallback	주소록 검색 결과를 받아 처리할 callback함수
 *
 * @return
 */
bizMOBCore.Contacts.get = function(options) {

    var action = "get";

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {
        id:"GET_CONTACT",
        param:{
            search_type : arguments[0]._sSearchType,
            search_text : arguments[0]._sSearchText,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};


/**
 *
 * 01.클래스 설명 : File 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : File 컨트롤 클래스
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.File = new Object();

bizMOBCore.File.servicename = "File";

// 모듈 config 변수
bizMOBCore.File.config = {};

// 모듈 config init 함수
bizMOBCore.File.init = function(config) {
    var setting = bizMOBCore.File.config;
    bizMOBCore.File.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * 파일 열기
 *
 * @param String _sSourcePath 열어볼 파일 경로. 기본 설치App으로 연결.
 * @param Function _fCallback 파일을 열고 난 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.open = function()
{
    var action = "open";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {
        id:"OPEN_FILE",
        param:{
            target_path : splitSourcePath.path,
            target_path_type : splitSourcePath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 파일 압축
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sTargetPath 결과 File Path.
 * @param Function _fCallback 압축 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.zip= function()
{
    var action = "zip";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

        id:"ZIP_FILE",
        param:{
            source_path: splitSourcePath.path,
            source_path_type: splitSourcePath.type,
            target_path: splitTargetPath.path,
            target_path_type: splitTargetPath.type,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 압축해제
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sDirectory 압축 해제할 Directory Path.
 * @param Function _fCallback 압축 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.unzip= function()
{
    var action = "unzip";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sDirectory);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

            id:"UNZIP_FILE",
            param:{
                source_path: splitSourcePath.path,
                source_path_type: splitSourcePath.type,
                target_directory: splitTargetPath.path,
                target_directory_type: splitTargetPath.type,
                callback:callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 이동
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sTargetPath 이동될 File Path.
 * @param Function _fCallback 이동 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.move = function()
{
    var action = "move";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

            id:"MOVE_FILE",
            param:{
                source_path: splitSourcePath.path,
                source_path_type: splitSourcePath.type,
                target_path: splitTargetPath.path,
                target_path_type: splitTargetPath.type,
                callback:callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 복사
 *
 * @param String _sSourcePath 소스 File Path.
 * @param String _sTargetPath 복사될 File Path.
 * @param Function _fCallback 복사 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.copy = function() {

    var action = "copy";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {

            "id": "COPY_FILE",
            "param": {
                source_path: splitSourcePath.path,
                source_path_type: splitSourcePath.type,
                target_path: splitTargetPath.path,
                target_path_type: splitTargetPath.type,
                callback:callback
            }
        };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 삭제
 *
 * @param Array _aSourcePath 삭제할 File Path 목록.
 * @param Function _fCallback 삭제 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.remove = function() {

    var action = "remove";

    var targetfiles = [];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    for(var i=0;i<arguments[0]._aSourcePath.length;i++){

        var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._aSourcePath[i]);

        var file = {
                "source_path": splitSourcePath.path,
                "source_path_type": splitSourcePath.type,
        };


        targetfiles[i] = file;
    }

    var tr = {

            "id": "REMOVE_FILES",
            "param": {
                list: targetfiles,
                callback:callback
            }
        };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 디렉토리 정보 읽기
 *
 * @param Array _aSourcePath 삭제할 File Path 목록.
 * @param Function _fCallback 삭제 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.directory = function()
{
    var action = "directory";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sDirectory);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

            id:"GET_DIRECTORY_INFO",
            param:{
                source_directory: splitSourcePath.path,
                source_directory_type: splitSourcePath.type,
                callback:callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 파일 존재 여부 확인
 *
 * @param String _sSourcePath 확인할 File Path 목록.
 * @param Function _fCallback 확인 후 호출될 callback함수.
 *
 * @return
 */
bizMOBCore.File.exist = function() {

    var action = "exist";

    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {

            id:"EXISTS_FILE",
            param:{
                source_path: splitSourcePath.path,
                source_path_type: splitSourcePath.type,
                callback:callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 업로드
 *
 * @param Array _aFileList	업로드할 File Path 목록.
 * @param Function _fCallback		결과를 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.File.upload = function() {

    var action = "upload";

    var file_list = arguments[0]._aFileList.map(function(row, index)	{
    var splitSourcePath = bizMOBCore.Module.pathParser(row._sSourcePath);

        return {
            source_path : splitSourcePath.path,
            source_path_type : splitSourcePath.type,
            file_name : row._sFileName
        };
    });

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr =
    {
            id:"FILE_UPLOAD",
            param:{
                list : file_list,
                callback : callback
            }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 다운로드
 *
 * @param Array _aFileList	다운로드할 URL 주소 목록.
 * @param String _sMode		파일 다운로드 모드. (background 또는 foreground ).
 * @param String _sProgressBar	다운로드할 때 프로그래스바 설정 값.( off , each, full )
 * @param Function _fCallback		결과를 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.File.download = function() {

    var action = "download";

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback, "listener");
    var file_list = arguments[0]._aFileList;
    var list_len = file_list.length;

    for(var i=0;i< list_len; i++){
        var splitTargetPath = bizMOBCore.Module.pathParser(file_list[i]._sDirectory);
        file_list[i].target_path = splitTargetPath.path + file_list[i]._sFileName,
        file_list[i].target_path_type = splitTargetPath.type,
        file_list[i].overwrite = file_list[i]._bOverwrite,
        file_list[i].uri = file_list[i]._sURI,
        file_list[i].file_id = i;
    }

    var tr = {

        id:"DOWNLOAD",
        param:{
            method:arguments[0]._sMode,
            uri_list:file_list,
            progress : arguments[0]._oProgressBar,
            callback:callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );

};

/**
 * 파일 정보 가져오기
 *
 * @param Array _aFileList	정보를 가져올 File Path 목록.
 * @param Function _fCallback		결과를 받을 callback 함수.
 *
 * @return
 */
bizMOBCore.File.getInfo = function()    {
    var action = "getInfo";

    var serviceName = this.servicename;
    var fileList = arguments[0]._aFileList.map(function(row, index)	{
        var splitSourcePath = bizMOBCore.Module.pathParser(row._sSourcePath);

        return {
            index : index,
            source_path : splitSourcePath.path,
            source_path_type : splitSourcePath.type
        };
    });
    var userCallback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    // JSON은 순서 보장이 안되니까 순서 맞춰서 usercallback대신 callback을 만들고
    // native에 callback보내고 callback안에서 usercallback부르도록
    var callback = bizMOBCore.CallbackManager.save(function(res)   {
        bizMOBCore.Module.logger(serviceName, action ,"D", res);

        if(res.result)	{
            var nonIndexFileList = [];

            res.list.forEach(function(row)    {
                var index = row.index;

                nonIndexFileList[index] = row;
                delete nonIndexFileList[index].index;
            });

            res.list = nonIndexFileList;
        }

        // script에서 호출하는 CallbackManager responser
        bizMOBCore.CallbackManager.responser({
            "callback" : userCallback
        }, {
            "message" : res
        });
    });

    var tr = {
        id : "GET_IMAGE_INFO",
        param : {
            file_path : fileList,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 이미지 파일 리사이즈
 *
 * @param Array _aFileList	이미지 파일 목록.
 * @param Boolean _bIsCopy	(Default : false) 원본 파일 유지 여부. (true 또는 false)
 * @param String _sTargetDirectory	_bIsCopy가 true일 경우 복사본이 저장될 디렉토리 경로.
 * @param Number _nWidth	파일의 가로 크기를 설정.
 * @param Number _nHeight	 파일의 세로 크기를 설정.
 * @param Number _nCompressRate	Number	X (Default : 1.0) 파일의 압축률 값( 0.0부터 1.0까지 값 지정가능 )
 * @param Number _nFileSize	리사이즈 된 파일 용량의 최대값.( byte단위 )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.File.resizeImage = function()    {
    var action = "resizeImage";

    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var fileList = arguments[0]._aFileList.map(function(row)	{
        var splitSourcePath = bizMOBCore.Module.pathParser(row._sSourcePath);

        return {
            source_path : splitSourcePath.path,
            source_path_type : splitSourcePath.type
        };
    });
    var splitTargetDir = bizMOBCore.Module.pathParser(arguments[0]._sTargetDirectory);
    // resizeImage가 가로, 세로를 줄이는게 아니라 용량을 줄이는 것
    var compressRate = isNaN(Number(arguments[0]._nCompressRate)) ? 1.0 : arguments[0]._nCompressRate;
    // 원본 보존할지 여부
    var copy = arguments[0]._bIsCopy === false ? false : true;

    var tr = {
        id : "RESIZE_IMAGE",
        param : {
            image_paths  : fileList,
            callback : callback,
            compress_rate : compressRate,
            copy_flag : copy,
            width : arguments[0]._nWidth,
            height : arguments[0]._nHeight,
            file_size : arguments[0]._nFileSize,
            target_path_type : splitTargetDir.type,
            target_path : splitTargetDir.path
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 이미지 파일 회전
 *
 * @param String _sSourcePath		이미지 File Path.
 * @param String _sTargetPath		회전된 이미지가 저장될 Path.
 * @param Number _nOrientation	회전 시킬 각도(EXIF_Orientation)값.(1, 2, 3, 4, 5, 6, 7, 8 )
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.File.rotateImage = function()    {
    var action = "rotateImage";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var splitSourcePath = bizMOBCore.Module.pathParser(arguments[0]._sSourcePath);
    var splitTargetPath = bizMOBCore.Module.pathParser(arguments[0]._sTargetPath);
    var orientation = (arguments[0]._nOrientation).toString();

    var tr = {
        id : "ROTATE_IMAGE",
        param : {
            orientation : orientation,
            source_path_type : splitSourcePath.type,
            source_path : splitSourcePath.path,
            target_path_type : splitTargetPath.type,
            target_path : splitTargetPath.path,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};


/**
 *
 * 01.클래스 설명 : Push 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : bizPush Server Open API연동 본 기능
 * 04.관련 API/화면/서비스 : bizMOBCore.Module.checkparam,bizMOBCore.Push.getAlarm,bizMOBCore.Push.getMessageList,bizMOBCore.Push.getPushKey,bizMOBCore.Push.getUnreadCount,bizMOBCore.Push.readMessage,bizMOBCore.Push.registerToServer,bizMOBCore.Push.sendMessage,bizMOBCore.Push.setAlarm,bizMOBCore.Push.setBadgeCount
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.PushManager = new Object();

bizMOBCore.PushManager.servicename = "PushManager";

// 모듈 config 변수
bizMOBCore.PushManager.config = {
    _sPushUrl: "", // Push 서버 URL
};

// 모듈 config init 함수
bizMOBCore.PushManager.init = function(config) {
    var setting = bizMOBCore.PushManager.config;
    bizMOBCore.PushManager.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

bizMOBCore.PushManager.userCallback = {};

/**
 * 푸시 기본 저장 정보 초기화
 *
 * @param
 *
 * @return
 */
bizMOBCore.PushManager.reset = function()	{
    bizMOBCore.Properties.remove({
        "_sKey" : "STORED_PUSHKEY"
    });
    bizMOBCore.Properties.remove({
        "_sKey" : "STORED_PUSH_USERID"
    });
    bizMOBCore.Properties.remove({
        "_sKey" : "IS_REGISTRATION"
    });
};

/**
 * 푸시 정보 등록 여부 체크
 *
 * @param
 *
 * @return Boolean isRegistration		등록 여부(true 또는 false )
 */
bizMOBCore.PushManager.isRegistration = function()	{
    // 앱 최초 실행 시, push서버에 register되었는지 확인(Properties)
    var isRegistration = bizMOBCore.Properties.get({
        "_sKey" : "IS_REGISTRATION"
    }) ? true : false;

    return isRegistration;
};

/**
 * 푸시 키 일치 여부 확인
 *
 * @param
 *
 * @return Boolean result		일치 여부(true 또는 false )
 */
bizMOBCore.PushManager.checkValidPushKey = function()	{
    // 네이티브 device에 등록된 push_key랑 property에 있는 push_key일치 여부
    var deviceInfoPushKey = bizMOB.Device.getInfo({
            "_sKey" : "push_key"
        });
    var storedPushKey = bizMOBCore.Properties.get({
        "_sKey" : "STORED_PUSHKEY"
    });
    var result = false;

    deviceInfoPushKey = bizMOBCore.PushManager.config._sPushUrl + ":" + deviceInfoPushKey;

    if(bizMOBCore.DeviceManager.isAndroid())	{
        if(typeof deviceInfoPushKey == "string")	{
            if(deviceInfoPushKey.trim().length > 0)	{
                if(deviceInfoPushKey == storedPushKey)	result = true;
            }
        }
    } else	{
        if(deviceInfoPushKey == storedPushKey)	result = true;
    }

    return result;
};

/**
 * 푸시 사용 유저 정보 조회
 *
 * @param String userId	비교할 유저ID
 *
 *
 * @return Boolean result		일치 여부(true 또는 false )
 */
bizMOBCore.PushManager.checkValidPushUserId = function(userId)	{
    // 1인 1디바이스가 아니라 한 어플리케이션에 로그아웃 후 다른 사용자로 로그인 시 userid가 등록되어 있는지 확인
    var storedPushUserId = bizMOBCore.Properties.get({
        "_sKey" : "STORED_PUSH_USERID"
    });
    var result = false;

    if(storedPushUserId != undefined)	{
        if(storedPushUserId.toString().trim().length > 0)	{
            if(storedPushUserId == userId)	{
                result = true;
            }
        }
    }

    return result;
};

/**
 * 푸시키 저장
 *
 * @param String pushKey	저장할 pushKey
 *
 * @return
 */
bizMOBCore.PushManager.setStoredPushKey = function(pushKey)	{
    // native에 push_key setting용도
    var storedPushKey = bizMOBCore.Properties.get({
        "_sKey" : "STORED_PUSHKEY"
    });

    pushKey = bizMOBCore.PushManager.config._sPushUrl + ":" + pushKey;

    if(storedPushKey != pushKey)	{
        bizMOBCore.Properties.set({
            "_sKey" : "STORED_PUSHKEY",
            "_vValue" : pushKey
        });
    }
};

/**
 * 푸시 사용 유저 정보 저장
 *
 * @param String userId	저장할 유저ID
 *
 * @return
 */
bizMOBCore.PushManager.setStoredPushUserId = function(userId)	{
    // native에 pushUserID 저장 용도
    var storedPushUserId = bizMOBCore.Properties.get({
        "_sKey" : "STORED_PUSH_USERID"
    });

    if(storedPushUserId != userId)	{
        bizMOBCore.Properties.set({
            "_sKey" : "STORED_PUSH_USERID",
            "_vValue" : userId
        });
    }
};

/**
 * 푸시키 정보 조회
 *
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 * @param Boolean _bProgressEnable		(default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 *
 * @return
 */
bizMOBCore.PushManager.getPushKey = function()	{
    // bizMOB push server로 부터 push key get
    var action = "getPushKey";
    var callback = bizMOBCore.CallbackManager.save(this.resGetPushKey);
    var userCallback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    this.userCallback[action] = userCallback;

    var tr = {
        id : "GET_PUSHKEY",
        param : {
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    if(!this.checkValidPushKey())	{
        bizMOBCore.Properties.remove({
            "_sKey" : "IS_REGISTRATION"
        });
        bizMOBCore.Module.gateway(tr, this.servicename, action);
    } else	{
        var returnValue = {
            "result" : true,
            "resultCode" : "0000",
            "resultMessage" : bizMOB.Device.getInfo({
                "_sKey" : "push_key"
            })
        };

        this.resGetPushKey(returnValue);
    }
};

/**
 * 푸시키 정보 결과처리 Callback 함수
 *
 * @param Object res	Native에서 전달받은 푸시키 정보 Data Object.
 *  *
 * @return
 */
bizMOBCore.PushManager.resGetPushKey = function(res)	{
    // push key get 후 response callback
    if(res.result)	{
        bizMOBCore.PushManager.setStoredPushKey(res.resultMessage);
        bizMOB.Device.Info.push_key = res.resultMessage;
    } else	{
        bizMOBCore.Module.logger(this.servicename, "getPushKey" ,"D", res.resultMessage);
    }

    bizMOBCore.CallbackManager.responser({
        "callback" : bizMOBCore.PushManager.userCallback["getPushKey"]
    }, {
        "message" : res
    });
}

/**
 * 푸시서버에 사용자 정보 등록
 *
 * @param String _sServerType		푸시키를 등록할 서버 타입.( bizpush 또는 push )
 * @param String_sUserId			푸시키를 등록할 사용자 아이디.
 * @param String _sAppName		푸시키를 등록할 앱 이름.
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 * @param Boolean _bProgressEnable		(default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 *
 * @return
 */
bizMOBCore.PushManager.registerToServer = function()	{
    // 서버에 register용도
    var action = "registerToServer";
    var callback = {};
    var userCallback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var userId = arguments[0]._sUserId;
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    this.userCallback[action] = userCallback;

    callback = function(res)	{
        bizMOBCore.PushManager.resRegistration(res, userId);
    };

    var tr = {
        id : "PUSH_REGISTRATION",
        param : {
            type : arguments[0]._sServerType,
            push_key : bizMOB.Device.getInfo({
                "_sKey" : "push_key"
            }),
            user_id : userId,
            app_name : arguments[0]._sAppName,
            callback : bizMOBCore.CallbackManager.save(callback),
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    if(this.checkValidPushUserId(userId) && this.isRegistration())	{
        var resultValue = {
            "result" : true,
            "resultCode" : "0000",
            "resultMessage" : "성공",
            "body" : null
        };

        this.resRegistration(resultValue, userId);
    } else	{
        bizMOBCore.Module.gateway(tr, this.servicename , action );
    }
};

/**
 * 푸시서버에 사용자 정보 등록 결과 처리 함
 *
 * @param Object res		Native에서 전달받은 등록 처리 결과 정보 Data
 * @param String_sUserId			등록한 사용자 아이디.
 *
 * @return
 */
bizMOBCore.PushManager.resRegistration = function(res, userId)	{
    // 서버 register 후 response callback
    if(res.result)	{
        bizMOBCore.Properties.set({
            "_sKey" : "IS_REGISTRATION",
            "_vValue" : true
        });

        bizMOBCore.PushManager.setStoredPushUserId(userId);
    } else	{
        bizMOBCore.Module.logger(this.servicename, "registerToServer" ,"D", res.resultMessage);
    }

    bizMOBCore.CallbackManager.responser({
        "callback" : bizMOBCore.PushManager.userCallback["registerToServer"]
    }, {
        "message" : res
    });
};

/**
 * 푸시 알람 수신여부 설정
 *
 * @param String _sUserId		푸시 알림 설정을 등록할 사용자 이이디.
 * @param Boolean  _bEnabled		(Default : true) 알람 수신 여부 설정 ( true 또는 false )
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.setAlarm = function()	{
    var action = "setAlarm";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : "PUSH_UPDATE_ALARM_SETTING",
        param : {
            user_id : arguments[0]._sUserId,
            push_key : arguments[0]._sPushKey,
            enabled : arguments[0]._bEnabled,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 알람 수신여부 조회
 *
 * @param String _sUserId		푸시 알림 설정을 조회할 사용자 이이디.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.getAlarm = function()	{
    var action = "getAlarm";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : "PUSH_ALARM_SETTING_INFO",
        param : {
            user_id : arguments[0]._sUserId,
            push_key : arguments[0]._sPushKey,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 수신 목록 조회
 *
 * @param String _sAppName	푸시 서버에 등록된 앱 이름.
 * @param String _sUserId		푸시 메세지를 조회할 사용자 이이디.
 * @param Number _nPageIndex	푸시 메세지를 가져올 페이징 값.
 * @param Number _nItemCount	푸시 메세지를 가져올 페이징 처리 갯수
 * @param Boolean _bProgressEnable		(default:true) 푸시 서버와 통신 중일때 화면에 progress 를 표시할지에 대한 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.getMessageList = function()	{
    var action = "getMessageList";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : "PUSH_GET_MESSAGES",
        param : {
            app_name : arguments[0]._sAppName,
            page_index : arguments[0]._nPageIndex,
            item_count : arguments[0]._nItemCount,
            user_id : arguments[0]._sUserId,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 메세지 읽기
 *
 * @param String _sTrxDay		푸시 메세지를 읽은 날짜.(yyyymmdd)
 * @param String _sTrxId		푸시 메세지 아이디.
 * @param String _sUserId	사용자 아이디.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.readMessage = function()	{
    var action = "read";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : "PUSH_MARK_AS_READ",
        param : {
            trx_day : arguments[0]._sTrxDay,
            trx_id : arguments[0]._sTrxId,
            user_id : arguments[0]._sUserId,
            read : true,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 읽지 않은 푸시 메세지 카운트 조회
 *
 * @param String _sAppName	푸시 서버에 등록된 앱 이름.
 * @param String _sUserId		푸시 메세지를 조회할 사용자 이이디.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.getUnreadMessageCount = function()	{
    var action = "getUnreadMessageCount";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : "PUSH_GET_UNREAD_PUSH_MESSAGE_COUNT",
        param : {
            app_name : arguments[0]._sAppName,
            user_id : arguments[0]._sUserId,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 앱 아이콘에 숫자 표시하기
 *
 * @param Number _nBadgeCount		뱃지에 표시할 값 .( 양수 : 표시할 갯수 ,  0 : 뱃지카운트 초기화 )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.setBadgeCount = function()	{
    var action = "setBadgeCount";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "SET_BADGE_COUNT",
        param : {
            badge_count : arguments[0]._nBadgeCount,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 푸시 메세지 발송
 *
 * @param String _sAppName	푸시 메세지 보낼 앱 이름.
 * @param Array _aUsers		푸시 메세지 받을 사용자 목록.
 * @param String _sFromUser	푸시 메세지를 보낼 사용자 아이디.
 * @param String _sSubject		푸시 메세지 제목.
 * @param String _sContent		푸시 메세지 내용.
 * @param String _sTrxType		(Default : INSTANT) 푸시 메세지 전송 방식.( INSTANT 또는 SCHEDULE )
 * @param String _sScheduleDate	푸시 메세지 전송 날짜.
 * @param Array _aGroups	푸시 메세지를 받을 그룹 목록
 * @param Boolean _bToAll	(Default : false) 해당 앱을 사용하는 전체 사용자에게 푸시 메세지를 발송할지 여부.
 * @param String _sCategory	(Default : def) 푸시 메세지 카테고리.
 * @param Object _oPayLoad	푸시 기폰 용량 초과시 전달할 메세지.
 * @param Boolean _bProgressEnable		(Default:true) 푸시 알람 설정 요청시 화면에 progress 표시 여부( true 또는 false )
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.sendMessage = function()	{
    var action = "sendMessage";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var progressEnable = arguments[0]._bProgressEnable === false ? false : true;

    var tr = {
        id : "SEND_PUSH_MESSAGE",
        param : {
            trx_type : arguments[0]._sTrxType,
            app_name : arguments[0]._sAppName,
            schedule_date : arguments[0]._sScheduleDate,
            to_users : arguments[0]._aUsers,
            to_groups : arguments[0]._aGroups,
            to_all : arguments[0]._bToAll,
            from_user : arguments[0]._sFromUser,
            message_subject : arguments[0]._sSubject,
            message_content : arguments[0]._sContent,
            message_category : arguments[0]._sCategory,
            message_payload : arguments[0]._oPayLoad,
            callback : callback,
            read_timeout : 10*1000,
            progress : progressEnable
        }

    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 * 대용량 푸시 메세지 읽기
 *
 * @param String _sMessageId	푸시 메세지 아이디.
 * @param String _sUserId	사용자 아이디.
 * @param Function _fCallback	결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.PushManager.readReceiptMessage = function()	{
    var action = "readReceiptMessage";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "CHECK_PUSH_RECEIVED",
        param : {
            callback : callback,
            user_id : arguments[0]._sUserId,
            message_id : arguments[0]._sMessageId
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename , action );
};

/**
 *
 * 01.클래스 설명 : Database 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : 컨테이너 SQLite DB 사용 기능
 *
 * @author 김승현
 * @version 1.0
 *
 */
bizMOBCore.Database = new Object();

bizMOBCore.Database.servicename = "Database";

// 모듈 config 변수
bizMOBCore.Database.config = {};

// 모듈 config init 함수
bizMOBCore.Database.init = function(config) {
    var setting = bizMOBCore.Database.config;
    bizMOBCore.Database.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * DataBase Open
 *
 * @param String _sDbName		오픈할 데이터베이스 명.
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.openDatabase = function()	{
    var action = "openDatabase";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);
    var dbName = arguments[0]._sDbName;

    var tr = {
        id : "OPEN_DATABASE",
        param : {
            db_name : dbName,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Close
 *
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.closeDatabase = function()	{
    var action = "closeDatabase";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "CLOSE_DATABASE",
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Transaction 시작
 *
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.beginTransaction = function()	{
    var action = "beginTransaction";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "BEGIN_TRANSACTION",
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Transaction Commit
 *
 * @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.commitTransaction = function()	{
    var action = "commitTransaction";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "COMMIT_TRANSACTION",
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * DataBase Transaction Rollback
 *
 *  @param Function _fCallback		결과를 받아 처리할 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.rollbackTransaction = function()	{
    var action = "rollbackTransaction";
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "ROLLBACK_TRANSACTION",
        param : {
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * SQL쿼리문을 실행
 *
 * @param String _sQuery		실행할 SQL SELECT 쿼리문.
 * @param Array _aBindingValues		쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param Function _fCallback		SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.executeSql = function()	{
    var action = "executeSql";
    var query = arguments[0]._sQuery;
    var bidingValues = arguments[0]._aBindingValues ? arguments[0]._aBindingValues:[];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "EXECUTE_SQL",
        param : {
            query : query,
            bind_array : bidingValues,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * SELECT SQL쿼리문을 실행
 *
 * @param String _sQuery		실행할 SQL SELECT 쿼리문.
 * @param Array _aBindingValues		쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param Function _fCallback		SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.executeSelect = function()	{
    var action = "executeSelect";
    var query = arguments[0]._sQuery;
    var bidingValues = arguments[0]._aBindingValues ? arguments[0]._aBindingValues:[];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "EXECUTE_SELECT",
        param : {
            query : query,
            bind_array : bidingValues,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 * SQL쿼리문을 일괄 실행
 *
 * @param String _sQuery		실행할 SQL SELECT 쿼리문.
 * @param Array _aBindingValues		쿼리문의 각 변수 위치에 대입해줄 값의 배열.
 * @param Function _fCallback		SQL쿼리문 실행 요청 후 호출되는 callback 함수.
 *
 * @return
 */
bizMOBCore.Database.executeBatchSql = function()	{
    // batch: 특정 query에 대해 반복할 때 사용
    var action = "executeBatchSql";
    var query = arguments[0]._sQuery;
    var bidingValues = arguments[0]._aBindingValues ? arguments[0]._aBindingValues:[];
    var callback = bizMOBCore.CallbackManager.save(arguments[0]._fCallback);

    var tr = {
        id : "EXECUTE_BATCH_SQL",
        param : {
            query : query,
            bind_array : bidingValues,
            callback : callback
        }
    };

    bizMOBCore.Module.gateway(tr, this.servicename, action);
};

/**
 *
 * 01.클래스 설명 : Http 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : bizMOB Http Client 관련 기능
 *
 * @author 최명훈
 * @version 1.0
 *
 */
bizMOBCore.Http = new Object();

bizMOBCore.Http.servicename = "Http";

// 모듈 config 변수
bizMOBCore.Http.config = {};

// 모듈 config init 함수
bizMOBCore.Http.init = function(config) {
    var setting = bizMOBCore.Http.config;
    bizMOBCore.Http.config = Object.assign({}, setting, config);
    bizMOBCore.Module.logger(this.servicename, "bizMOBCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * 요청 파라미터를 fetch 형태에 맞춰서 변경 후 요청
 * @param {Object} arg 요청 객체
 * @param {String} arg.url
 * @param {Number} arg.timeout 요청 제한시간
 * @param {Number} arg.retries 실패시 제요청 회수
 * @param {Object} arg.option fetch options
 * @param {Object} arg.headers request 요청 header
 * @param {Object} arg.body request 요청 body
 * @param {Function} arg.callback (custom) 요청 성공/실패시 응답값 반환 함수
 * @return
 */
bizMOBCore.Http.request = function(arg) {
    // 변수 설정
    var url = arg.url;
    var option = Object.assign({}, {
        method: arg.method,
        headers: arg.headers,
        body: new URLSearchParams(arg.body || {}).toString(),
    }, arg.option);
    var timeout = arg.timeout;
    var retries = arg.retries;

    // Get 변수 처리
    if (option.method === "GET") {
        url += "?" + option.body;
        delete option.body;
    }

    // custom 변수 제거
    delete option.timeout;
    delete option.retries;

    // Http.fetch 요청
    bizMOBCore.Http.fetch(url, option, timeout, retries)
        .then(function(res) { arg.callback && arg.callback(res); })
        .catch(function(res) { arg.callback && arg.callback(res); });
};

/**
 * timeout + retries + fetch
 * @param {String} url 요청 URL
 * @param {Object} opt fetch 옵션
 * @param {Number} limitTime Timeout 시간
 * @param {Number} retries 재시도 횟수
 *
 * @return
 * @param {Boolean} ok 성공여부
 * @param {Number} status 결과 코드 (200, 404, ...)
 * @param {String} statusText 결과 Text
 * @param {Object} data 데이터
 */
bizMOBCore.Http.fetch = function(url, opt, limitTime, retries) {
    var option = opt; // fetch option 셋팅
    var limit = limitTime || 5000; // timeout 시간
    var retry = retries || 1; // 재요청 회수

    // Fetch 요청 Promise
    var attemptFetch = function(url, opt) {
        return new Promise(function(resolve, reject) {
            fetch(url, opt).then(function (res) {
                if (res.ok) {
                    resolve(res.json());
                }
                else {
                    reject(res);
                }
            });
        });
    };

    // Timeout 제한 Promise
    var timeout = function(timeout) {
        return new Promise(function(_, reject) {
            setTimeout(function() { reject(new Error("timeout error")); }, timeout);
        });
    };

    // Promise 객체 Return
    return new Promise(function(resolve, reject) {
        var attempts = 1;
        var executeFetch = function() {
            var fetchAttempt = Promise.race([ attemptFetch(url, option), timeout(limit) ]); // 요청 경쟁
            var maxRetry = retry; // 최대 리트라이 회수

            // Fetch 요청
            fetchAttempt
                .then(function(data) {
                    resolve({ ok: true, status: 200, statusText: "OK", data: data });
                })
                .catch(function(res) {
                    if (attempts < maxRetry) {
                        attempts++;
                        executeFetch(); // 재발송 회수만큼 재귀 호출
                    }
                    else {
                        reject({ ok: res.ok, status: res.status, statusText: res.statusText, data: null });
                    }
                });
        };

        // 요청 함수 실행
        executeFetch();
    });
};

console.log("bizMOBCore ready." );
