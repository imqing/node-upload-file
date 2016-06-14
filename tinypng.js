/**
 * Author: Coral.Qing <imqing@vip.qq.com>
 * Date: 2016/2/25
 * 图片压缩
 */
"use strict";
var tinify = require('tinify');
tinify.key = 'ixoFcvQfFkWXnmT7DAYApu18GJBj-zR8';

var tasks = {
    'richMan' : 51
};

var argv = process.argv.slice(2);

if (tasks[argv[0]]) {
    if (argv[0] == 'richMan') {
        for (var i = 50; i < tasks[argv[0]]; i++) {
            let j = i;
            let source = tinify.fromFile('../img/richMan/' + i + '.png');
            source.toFile('out/' + j + '.png');
        }
    }
}

if (argv[0] == 't') {
    let imgs = ['img_prize.png', 'title_reward1.png', 'title_reward2.png'];
    for (let i = 0; i < imgs.length; i++) {
        let source = tinify.fromFile(imgs[i]);
        source.toFile('out/' + imgs[i]);
    }

}