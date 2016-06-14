/**
 * Author: Coral.Qing <imqing@vip.qq.com>
 * Date: 2016/3/15
 */
"use strict";
const BASE_DIR = '..';
var CMD_MAP = {
    'test' : BASE_DIR + '/game/zshh'
};

var fs = require('fs');
var uploadFile = require('./uploadFile');

var argv = process.argv.slice(2);

console.log(argv);

if(CMD_MAP[argv[0]]){
    let dir = CMD_MAP[argv[0]];

    fs.stat(dir, (err, stats) => {
        if(err){
            throw err;
        }else{
            if(stats.isDirectory()){
                let files = fs.readdirSync(dir);
                for(let i = 0, len = files.length; i < len; i++){
                    if(files[i] == '.' || files[i] == '..'){
                        continue;
                    }

                    let stat = fs.stat(files[i]);

                }
            }
        }
    });
}
