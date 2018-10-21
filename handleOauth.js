const registerOauth = require('registerOauth');
const registrationPage = require('./registrationPage');

exports.handler = (event, context, callback) => {
    console.log(event.queryStringParameters);
    registerOauth(event.queryStringParameters.code, (result) => {
        const response = {
            statusCode: 200,
            headers: {"content-type": "text/html"},
            body: registrationPage,
        }
        callback(null, response);
    });
};
