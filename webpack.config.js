const path = require('path');

module.exports = {
    entry: './unidiff.js',  //入口文件
    output: {  //输出文件路径设置
        path: path.resolve(__dirname, 'dist'),
        filename: './dist/unidiffer.js',
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }]
    }
}
