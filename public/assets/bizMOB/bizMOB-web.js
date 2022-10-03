/**
 * TODO 작업 중
 * @author 최명훈
 * @version 0.1
 */

var bizMOBWebCore = {};

bizMOBWebCore.name = "bizMOBWebCore";
bizMOBWebCore.version = "0.1";
bizMOBWebCore.logLevel = "1248";  //Log(1)Debug(2)Warn(4)Error(8)

// Class별 Config init
bizMOBWebCore.setConfig = function(arg) {
    for (var key in arg) {
        if (Object.hasOwnProperty.call(arg, key)) {
            var handler = bizMOBWebCore[key];
            var data = arg[key];

            if (!handler) {
                bizMOBWebCore.Module.logger("bizMOBWebCore", "setConfig" ,"E", "Not found class: " + key);
            }
            else if (!Object.hasOwnProperty.call(handler, "setConfig") || typeof handler.setConfig !== "function") {
                bizMOBWebCore.Module.logger("bizMOBWebCore", "setConfig" ,"E", "Not found class setConfig function: " + key);
            } else {
                bizMOBWebCore.Module.logger("bizMOBWebCore", "setConfig" ,"D", key + " Class Config set" + JSON.stringify(data) );
                handler.setConfig(data);
            }
        }
    }
};

/**
 * bizMOBCore.App에 해당하는 Web 클래스
 */
bizMOBWebCore.Web = {};
bizMOBWebCore.Web.serviceName = "Web";
bizMOBWebCore.Web.config = {
    _sAppKey: "", // requestLogin 요청시 전달할 Native App Key
    _bIsRelease: false, // 운영 빌드 여부
};
bizMOBWebCore.Web.setConfig = function(config) {
    var setting = bizMOBWebCore.App.config;
    bizMOBWebCore.App.config = Object.assign({}, setting, config);
    bizMOBWebCore.Module.logger(this.serviceName, "bizMOBWebCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};


/**
 * Web Module 클래스
 */
bizMOBWebCore.Module = {};
bizMOBWebCore.Module.serviceName = "WebModule";
bizMOBWebCore.Module.config = {};
bizMOBWebCore.Module.setConfig = function(config) {
    var setting = bizMOBWebCore.Module.config;
    bizMOBWebCore.Module.config = Object.assign({}, setting, config);
    bizMOBWebCore.Module.logger(this.serviceName, "bizMOBWebCore Module init", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * Log 출력
 * @param String sServiceName 요청한 커맨드의 서비스명 정보.
 * @param String sAction 요청한 커맨드의 서비스내 기능 정보.
 * @param String sLogType 로그 레벨
 * @param String sMessage 로그 메세지
 */
bizMOBWebCore.Module.logger = function(sService, sAction, sLogType, sMessage){

    var logMsg = "[" + sService + "]" + "["+sAction+"] - " + sMessage;
    var logLevel = bizMOBWebCore.logLevel;

    logMsg = logMsg.replace(/\{/gi, "{\n").replace(/\}/gi, "}\n").replace(/\\"/gi, "");

    if (typeof logLevel == "string" && logLevel.length==4) {
        var logLevelArr = logLevel.split("");

        switch(sLogType){
            case "I" : // Info
            case "L" : // Log
                if (logLevelArr[0].indexOf("1") > -1) {
                    console.log("bizMOB Web LOG :" + logMsg);
                }
                break;

            case "D" : // Debug
                if (logLevelArr[1].indexOf("2") > -1) {
                    console.warn("bizMOB Web DEBUG:" + logMsg);
                }
                break;

            case "W" : // Warn
                if (logLevelArr[2].indexOf("4") > -1) {
                    console.log("bizMOB Web WARN :" + logMsg);
                }
                break;

            case "E" : // Error
                if (logLevelArr[3].indexOf("8") > -1) {
                    console.error("bizMOB Web ERROR : " + logMsg);
                    console.trace();
                    throw("bizMOB error. stop process");
                }
                break;
        }
    }
};


/**
 * Web Network 클래스
 */
bizMOBWebCore.Network = {};
bizMOBWebCore.Network.serviceName = "WebNetwork";
bizMOBWebCore.Network.config = {
    _sBaseUrl: "/", // Client Base Url
    _sContext: "/proxy.server", // Client Context
};
bizMOBWebCore.Network.setConfig = function(config) {
    var setting = bizMOBWebCore.Network.config;
    bizMOBWebCore.Network.config = Object.assign({}, setting, config);
    bizMOBWebCore.Module.logger(this.serviceName, "bizMOBWebCore Network Set Config", "D", "Config initialized - " + JSON.stringify(config));
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
 bizMOBWebCore.Network.requestTr = function() {
    var timeout = 60 * 1000;
    var message = {
        header: Object.assign({}, {
            result: true,
            error_code: "",
            error_text: "",
            info_text: "",
            message_version: "",
            login_session_id: "",
            trcode: arguments[0]._sTrcode
        }, arguments[0]._oHeader),
        body: arguments[0]._oBody
    };

    /** Parameter 셋팅 */
    var url = (bizMOBWebCore.Network.config._sContext === "/" ? "" : bizMOBWebCore.Network.config._sContext) + "/" + arg._sTrcode + ".json";
    var body = { message: JSON.stringify(message) };
    var option = bizMOBWebCore.Http.bizmobOption();

    /** Mock 조회 여부에 따른 option 부가 정보 셋팅 */
    if (arguments[0]._bMock) {
        option.method = "GET";
        url = bizMOBWebCore.Network.config._sBaseUrl + "mock/" + arguments[0]._sTrcode + ".json?" + new URLSearchParams(body);
    }
    else {
        option.method = "POST";
        option.body = new URLSearchParams(body || {}).toString();
    }

    /** Http.fetch 호출 */
    bizMOBWebCore.Http.fetch(url, option, timeout)
        .then(function(res) {
            bizMOBWebCore.Module.logger(this.serviceName, "request", "D", "Web Response Parameter");
            if (res.data.header.result) {
                bizMOBWebCore.Module.logger(this.serviceName, "request", "D",  JSON.stringify(res.data.body.legacy_message));
            } else {
                bizMOBWebCore.Module.logger(this.serviceName, "request", "D",  JSON.stringify(res.data));
            }
            arguments[0]._fCallback && arguments[0]._fCallback(res.data);
        })
        .catch(function() {
            arguments[0]._fCallback && arguments[0]._fCallback({
                header: Object.assign({}, {
                    result: false,
                    error_code: 'NE0002',
                }, message.header),
            });
        });
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
 bizMOBWebCore.Network.requestLogin = function() {
    var timeout = 10 * 1000;
    var legacy_message = {
        header: Object.assign({}, {
            result: true,
            error_code: "",
            error_text: "",
            info_text: "",
            message_version: "",
            login_session_id: "",
            trcode: arguments[0]._sTrcode
        }, arguments[0]._oHeader),
        body: arguments[0]._oBody
    };

    /** Parameter 셋팅 */
    var url = (bizMOBWebCore.Network.config._sContext === "/" ? "" : bizMOBWebCore.Network.config._sContext) + "/LOGIN.json";
    var message = {
        header: {
            result: true,
            error_code: "",
            error_text: "",
            info_text: "",
            locale: 'ko',
            message_version: "",
            login_session_id: "",
            trcode: "LOGIN",
        },
        body: {
            os_type: 'web',
            user_id: arguments[0]._sUserId,
            password: arguments[0]._sPassword,
            legacy_message: legacy_message,
            legacy_trcode: arguments[0]._sTrcode,
            app_key: bizMOBWebCore.Web.config._sAppKey ? bizMOBWebCore.Web.config._sAppKey : "",
            emulator_flag: true,
            manual_phone_number: false,
            device_id: '',
            phone_number: '',
        },
    };

    bizMOBWebCore.Module.logger(this.serviceName, "requestLogin", "D", "Web Request Parameter");
    bizMOBWebCore.Module.logger(this.serviceName, "requestLogin", "D",  JSON.stringify(message));

    var body = { message: JSON.stringify(message) };
    var option = bizMOBWebCore.Http.bizmobOption();

    /** Mock 조회 여부에 따른 option 부가 정보 셋팅 */
    if (arguments[0]._bMock) {
        option.method = "GET";
        url = bizMOBWebCore.Network.config._sBaseUrl + "mock/" + arguments[0]._sTrcode + ".json?" + new URLSearchParams(body);
        bizMOBWebCore.Module.logger(this.serviceName, "requestLogin", "W", "Mock Data Request.");
    }
    else {
        option.method = "POST";
        option.body = new URLSearchParams(body || {}).toString();
    }

    /** Http.fetch 호출 */
    bizMOBWebCore.Http.fetch(url, option, timeout)
        .then(function(res) {
            bizMOBWebCore.Module.logger(this.serviceName, "requestLogin", "D", "Web Response Parameter");
            if (res.data.header.result) {
                bizMOBWebCore.Module.logger(this.serviceName, "requestLogin", "D",  JSON.stringify(res.data.body.legacy_message));
            } else {
                bizMOBWebCore.Module.logger(this.serviceName, "requestLogin", "D",  JSON.stringify(res.data));
            }
            arguments[0]._fCallback && arguments[0]._fCallback(res.data.header.result ? res.data.body.legacy_message : res.data);
        })
        .catch(function() {
            arguments[0]._fCallback && arguments[0]._fCallback({
                header: Object.assign({}, {
                    result: false,
                    error_code: 'NE0002',
                }, message.header),
            });
        });
};

/**
 *
 * 01.클래스 설명 : Http 기능 클래스
 * 02.제품구분 : bizMOB Xross
 * 03.기능(콤퍼넌트) 명 : bizMOB Http Client 관련 기능
 */
bizMOBWebCore.Http = {};
bizMOBWebCore.Http.config = {};
bizMOBWebCore.Http.serviceName = "Http";

/**
 * 모듈 config init 함수
 */
bizMOBWebCore.Http.setConfig = function(config) {
    var setting = bizMOBWebCore.Http.config;
    bizMOBWebCore.Http.config = Object.assign({}, setting, config);
    bizMOBWebCore.Module.logger(this.serviceName, "bizMOBWebCore Http Set Config", "D", "Config initialized - " + JSON.stringify(config));
};

/**
 * bizMOB Server용 fetch option 정보
 */
bizMOBWebCore.Http.bizmobOption = function() {
    return {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        mode: "cors", // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    };
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
bizMOBWebCore.Http.request = function(arg) {
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
    bizMOBWebCore.Http.fetch(url, option, timeout, retries)
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
bizMOBWebCore.Http.fetch = function(url, opt, limitTime, retries) {
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