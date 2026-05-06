/**
 * CSInterface - Minimal wrapper around Adobe CEP native bridge (__adobe_cep__)
 * Based on the Adobe CEP public API.
 */

var SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};

function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope;
    this.appId = appId;
    this.extensionId = extensionId;
    this.data = "";
}

function CSInterface() {}

CSInterface.prototype.getHostEnvironment = function () {
    try {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
    } catch (e) {
        return null;
    }
};

CSInterface.prototype.getSystemPath = function (pathType) {
    var path = "";
    try {
        path = window.__adobe_cep__.getSystemPath(pathType);
    } catch (e) {}
    return path;
};

CSInterface.prototype.evalScript = function (script, callback) {
    if (callback === null || callback === undefined) {
        callback = function () {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.addEventListener = function (type, listener, obj) {
    window.__adobe_cep__.addEventListener(type, listener, obj);
};

CSInterface.prototype.removeEventListener = function (type, listener, obj) {
    window.__adobe_cep__.removeEventListener(type, listener, obj);
};

CSInterface.prototype.dispatchEvent = function (event) {
    if (typeof event.data === "object") {
        event.data = JSON.stringify(event.data);
    }
    window.__adobe_cep__.dispatchEvent(event);
};

CSInterface.prototype.closeExtension = function () {
    window.__adobe_cep__.closeExtension();
};

CSInterface.prototype.getExtensionId = function () {
    return window.__adobe_cep__.getExtensionId();
};

CSInterface.prototype.requestOpenExtension = function (extensionId, params) {
    window.__adobe_cep__.requestOpenExtension(extensionId, params);
};

CSInterface.prototype.getExtensions = function (extensionIds) {
    try {
        var extensionIdsStr = JSON.stringify(extensionIds);
        var extensionsStr = window.__adobe_cep__.getExtensions(extensionIdsStr);
        return JSON.parse(extensionsStr);
    } catch (e) {
        return [];
    }
};

CSInterface.prototype.registerKeyEventsInterest = function (keyEventsInterest) {
    return window.__adobe_cep__.registerKeyEventsInterest(keyEventsInterest);
};

CSInterface.prototype.setScriptTimeout = function (timeout) {
    window.__adobe_cep__.setScriptTimeout(timeout);
};

CSInterface.prototype.getCurrentApiVersion = function () {
    try {
        return JSON.parse(window.__adobe_cep__.getCurrentApiVersion());
    } catch (e) {
        return { major: 0, minor: 0, micro: 0 };
    }
};
