@Author： Coral.Qing
基于NodeJS,在本地分析php文件中引入的JS和CSS文件，然后进行打包压缩；

只能分析单个php文件中的js和css，不包括php include的文件；

css以<link rel="stylesheet" href="/style/newHome/index-v3.css">形式导入
js以<script src="/script/newHome/main-2015-v3.js?__pack"></script>形式导入

href或者src的文件，不要包含querystring，除非需要指定打包，或者忽略打包参数
比如  a.css?__pack,  b.css?__pack 最终会打包成 pkg_md5.css；
js类似

所有的打包都会压缩，使用cleanCss或者UglifyJS；

参数?__pass表示会忽略些文件,不会作任何处理；最终生成的php文件也会包含?__pass，
可以考虑在后期去掉该php文件中的参数

需要添加任务的时候，在index.js中的fileMap中添加键值映射
key 是nodejs 命令，比如 node index.js <key>

其中file是要处理的php文件，目前只支持单文件处理，打包的文件都会打包成单独的一个文件；
比pkg_xxx.js pkg_xxx.css

toPathCss 是打包的css上传的路径
toPathJs 是打包的js上传的路径


如果是ES6或者一些CMD的代码，需要先处理，目前还不支持
目前我的ES6代码通常是在本地开启了一个watchify,会自动生成一个bundle.js
所以页面也是引入的bundle.js，所以可以直接打包