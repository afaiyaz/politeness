const registerOauth = require('registerOauth');

exports.handler = (event, context, callback) => {
    console.log(event.queryStringParameters);
    registerOauth(event.queryStringParameters.code, (result) => {
        const response = {
            statusCode: 200,
            headers: {"content-type": "text/html"},
            body: '<p>Thank you for registering with our Application!<p>'
        }
        callback(null, response);
    });
};
