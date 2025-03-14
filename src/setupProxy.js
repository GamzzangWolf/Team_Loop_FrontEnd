const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api', 
        createProxyMiddleware({
            target: 'http://127.0.0.1:8080/api', // 백엔드 서버의 주소
            changeOrigin: true, // 요청의 Origin 헤더를 프록시 서버의 주소로 변경
        })
    );
};