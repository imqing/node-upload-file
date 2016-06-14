/**
 * Author: Coral.Qing <imqing@vip.qq.com>
 * Date: 2016/1/6
 */
var http = require('http');
http.request = (function (_request) {
    return function (options, callback) {
        var timeout = options['timeout'],
            timeoutEventId;
        var req = _request(options, function (res) {
            res.on('end', function () {
                clearTimeout(timeoutEventId);
                //console.log('response end...');
            });

            res.on('close', function () {
                clearTimeout(timeoutEventId);
                //console.log('response close...');
            });

            res.on('abort', function () {
                //console.log('abort...');
            });

            callback(res);
        });

        //超时
        req.on('timeout', function () {
            //req.res && req.res.abort();
            //req.abort();
            req.end();
        });

        //如果存在超时
        timeout && (timeoutEventId = setTimeout(function () {
            req.emit('timeout', {message : 'have been timeout...'});
        }, timeout));
        return req;
    };
})(http.request);

http.request({
    host    : "www.xjflcp.com",
    timeout : 50000,
    path    : '/game/sscIndex'
}, function (res) {
    var data = [];
    res.on('data', function(str){
        data.push(str);
    });

    res.on('end', function(){
        console.log(data.length);
    });
});