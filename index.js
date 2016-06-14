/**
 * Author: Coral.Qing <imqing@vip.qq.com>
 * Date: 2016/1/4
 */
"use strict";
var fs = require('fs');
var crypto = require('crypto');
var readline = require('readline');

var UglifyJS = require('uglify-js');
var CleanCss = require('clean-css');
var uploadFile = require('./uploadFile');

var baseDir = '..', outDir = './out/';

//需要添加任务的时候，在fileMap中添加
//key 是nodejs 命令，比如 node index.js <key>
//文件映射
var fileMap = {
    'index' : {
        file:'/view/newHome/index.php',
        toPathCss: '/style/newHome/',
        toPathJs: '/script/newHome/'
    },
    'indexTest' :{
        file:'/view/newHome/indexTest.php',
        toPathCss: '/style/newHome/',
        toPathJs: '/script/newHome/'
    },
    'live' : {
        file:'/view/newLive/channel.php',
        toPathCss: '/style/live/',
        toPathJs: '/script/live/build/'
    },
    'liveTest' : {
        file:'/view/newLive/channelTest.php',
        toPathCss: '/style/live/',
        toPathJs: '/script/live/build/'
    },
    'gohome' : {
        file: '/activity/gohome/index.php',
        toPathCss: '/activity/gohome/css/',
        toPathJs: '/activity/gohome/js/'
    },
    'mmwz' : {
        file: '/activity/mmwz/index.php',
        toPathCss: '/activity/mmwz/css/',
        toPathJs: '/activity/mmwz/js/'
    },
    'video' : {
        file: '/view/newHome/video.php',
        toPathCss: '/style/newHome/',
        toPathJs: '/script/newHome/'
    },
    'videoList' : {
        file: '/view/newHome/videoList.php',
        toPathCss: '/style/newHome',
        toPathJs: '/script/newHome'
    }
};

//该参数表明文件需要打包压缩
var sPack = '?__pack',
    sPass = '?__pass';//表示不处理该文件

var argv = process.argv.slice(2);



//创建输出目录,如果已经存在，则清空

fs.stat('./out', (err, stat) => {
    if(err){
        console.log('does not exist');
        fs.mkdirSync('./out');
    }else{
        if(stat.isDirectory()){
            //清空
            var list = fs.readdirSync('./out');
            list.forEach(function(item){
                fs.unlinkSync('./out/' + item);
            });
        }
    }
});

//分析文件
var option = fileMap[argv[0]];
//所有的css和js；
var cacheLinks = [], cacheScripts = [];
//需要打包的css和js
var cachePackLinks = [], cachePackScripts = [];
//路径替换映射
var pathMirror = {};


if(argv.length && (option !== undefined)){

    fs.readFile(baseDir + option.file, 'utf-8', (err, data) => {

        var file = option.file;

        if(err){
            console.log(file + ' err');
        }else{
            cacheLinks = getLinkHref(data);
            cacheScripts = getScriptSrc(data);

            //将css和js压缩打包
            cacheLinks.forEach((item) => {
                if(item.indexOf(sPack) >= 0){
                    cachePackLinks.push(item.split(sPack)[0]);
                }else if(item.indexOf(sPass) >= 0){
                    //忽略处理该文件
                    //writeMd5File(item);
                }else{
                    writeMd5File(item.replace(/\?.*/, ''));
                }
            });

            cacheScripts.forEach((item) => {
                if(item.indexOf(sPack) >= 0){
                    cachePackScripts.push(item.split(sPack)[0]);
                }else if(item.indexOf(sPass) >= 0){
                    //
                    //如果script中包含?__pass,则不处理js
                }else{
                     writeMd5File(item, 'js');
                }
            });

            //将js和css打包到一个文件中
            var cacheCssContent = '', cacheJsContent = '';
            cachePackLinks.forEach((item) => {
                cacheCssContent += fs.readFileSync(baseDir + item, 'utf-8');
            });

            cachePackScripts.forEach((item) => {
                cacheJsContent += fs.readFileSync(baseDir + item, 'utf-8');
            });

            cacheCssContent = cleanCss(cacheCssContent);
            cacheJsContent = uglifyJS(cacheJsContent);

            var pkgPrefix = file.substring(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));

            //输出打包的css和js
            if(cachePackLinks.length){
                //文件名+md5
                //如index.php-md5
                var pkgCss = pkgPrefix + '.' + md5(cacheCssContent).substring(0, 7) + '.css';
                pathMirror['__pkg_{md5}.css'] = pkgCss;
                fs.writeFileSync(outDir  + pkgCss, cacheCssContent, 'utf-8');
            }

            if(cachePackScripts.length){
                var pkgJs = pkgPrefix + '.' + md5(cacheJsContent).substring(0, 7) + '.js';
                pathMirror['__pkg_{md5}.js'] = pkgJs;
                fs.writeFileSync(outDir + pkgJs, cacheJsContent, 'utf-8');
            }

            //替换文件中的路径
            var filename = file.substring(file.lastIndexOf('/') + 1);

            //输出打包的原始php文件
            fs.writeFileSync(outDir + filename, parseCssJs(parseCssJs(data, 'css')), 'utf-8');
            //把要上传的文件添加进去
            pathMirror[option.file] = filename;


            confirmUpload(pathMirror);

        }


    });

}

function md5(content){
    return crypto.createHash('md5').update(content).digest('hex');
}

//写文件，type： css/js
function writeMd5File(path, type){
    var content = fs.readFileSync(baseDir + path, 'utf-8');
    //压缩css
    content = type == 'js' ? uglifyJS(content) : cleanCss(content);
    var md5Content = md5(content);
    var md5Path = md5(path);
    //将path/to/a.css生成a_md5(path/to/a.css)_md5(content).css;
    var name = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.')) + '_' + md5Path.substring(0, 7) + '_' + md5Content.substring(0, 7) + path.substring(path.lastIndexOf('.'));
    pathMirror[path] = name;
    fs.writeFileSync(outDir + name, content, 'utf-8');
}

//获取<link href="">
var rRegLink = /<\s*?\blink\b(?:(\s|\S)*?)\bhref\s*=\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^\s}]+)([^>]*?)\/?>/ig;
function getLinkHref(content){
    var rReg = rRegLink;
    var ret = content.match(rReg) || [];

    ret = ret.map((item) => {
        return item.match(/href\s*=\s*(?:("|'))(.*?\.css(\?__[\w]+)?)\1/i)[2];
    });

    return ret;
}

//获取<script src="">
var rRegScript = /<\s*?\b(script)\b[^>]*?\bsrc\s*=\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^\s}]+)<\/\1>/ig;
function getScriptSrc(content){
    var rReg = rRegScript;
    var ret = content.match(rReg) || [];

    ret = ret.map((item) => {
        return item.match(/src\s*=\s*(?:("|'))(.*?\.js(\?__[\w]+)?)\1/i)[2];
    });

    return ret;
}

function uglifyJS(content, conf){
    var ret = UglifyJS.minify(content, {fromString: true});
    return ret.code;
}

function cleanCss(content, conf){
    var ret = (new CleanCss()).minify(content).styles;
    return ret;
}

//文件路径为path/to/a/b/c.ext;
//比如/style/newHome/a.css;
//比如/script/newHome/a.js;
//即把/style/newHome/a.css?__pack替换成 /style/newHome/pkg_{md5}.css;
//type:css/js
function parseCssJs(content, type){
    var hasPack = false;
    //匹配结果为  "/style/newHome/index-v3.css"
    //    "/script/jquery-1.10.2.min.js">  包含引号
    content = content.replace((type == 'css' ? rRegLink : rRegScript), function(match, $1, $2, $3){
        if(match.indexOf(sPack) >= 0){
            if(hasPack){
                return '';
            }else{
                hasPack = true;
                var $2replace = $2.substring($2.lastIndexOf('/') + 1, $2.lastIndexOf(sPack) + sPack.length);
                $2replace = $2.replace($2replace, pathMirror['__pkg_{md5}.' + (type == 'css' ? 'css' : 'js')]);
                return match.replace($2, $2replace.replace($2.substring(1, $2.lastIndexOf('/') + 1), (type == 'css' ? option.toPathCss : option.toPathJs)));
            }

        }else{
            //如果路径中包含该路径，则替换
            var target = type == 'css' ? cacheLinks : cacheScripts;
            target.forEach((item) => {
                if(match.indexOf(item) >= 0 && pathMirror[item]){
                    match = match.replace(item, item.substring(0, item.lastIndexOf('/') + 1) + pathMirror[item]);
                }
            });
            return match.replace(sPass, '');
        }
    });

    return content;
}

function confirmUpload(pathMirror) {
    var rl = readline.createInterface({
        input  : process.stdin,
        output : process.stdout
    });

    let list = fs.readdirSync(outDir);
    console.log('File list:');
    console.log('  ' + list.join('\n  '));

    //todo 文件上传顺序
    //目录没有保证上传的顺序，所以，可能出现php文件先上传，

    rl.question("Check the files and press Y/y to upload.. \n  ", function (answer) {
        // TODO: Log the answer in a database
        console.log("you selected ", answer);
        if(answer.toLowerCase() == 'y'){
            for(var name in pathMirror){
                var filepath = pathMirror[name];
                (function(filepath){
                    fs.stat(outDir + filepath, function(err, stat){
                        if(err){
                            console.log(filepath + ' does not exist, ignored');
                        }else{
                            var to = option.file;
                            var ext = filepath.substring(filepath.lastIndexOf('.') + 1);
                            if( ext == 'css'){
                                to = option.toPathCss + filepath
                            }else if(ext == 'js'){
                                to = option.toPathJs + filepath;
                            }
                            console.log('Upload ' + filepath + ' to ' + to);
                            var content = fs.readFileSync(outDir + filepath, 'utf8');
                            var date = new Date();
                            //密码
                            //日期没有前导0；
                            var pass = 'your password';

                            uploadFile('your server address', {}, {to: to, pass: pass}, content, filepath, function(a, b){
                                if(b == 0){
                                    console.log( 'OK:   Upload file <' + filepath + '>');
                                }else{
                                    console.log('FAIL: Upload file <' + filepath + '>', 'ERROR Status: ' + a);
                                }

                            });
                        }
                })})(filepath);
            }
            //uploadFile('http://alive.tv/reciever.php', {}, to, content, path, callback);
        }
        rl.close();
    });
}
