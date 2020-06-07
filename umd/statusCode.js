(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        200: '请求成功',
        201: '新建/修改数据成功',
        202: '已经进入后台排队',
        204: '删除数据成功',
        400: '发出的请求有错误，服务器没有进行新建或修改数据的操作',
        401: '用户没有权限（令牌、用户名、密码错误）',
        403: '没有访问权限',
        404: '请求目标不存在',
        406: '请求的格式不可得',
        408: '请求超时',
        410: '请求的资源被永久删除',
        422: '当创建一个对象时，发生一个验证错误',
        500: '服务器发生错误',
        502: '网关错误',
        503: '服务器暂时过载或维护',
        504: '网关超时',
    };
});