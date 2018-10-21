const evaluate = require('evaluate');
const querystring = require('querystring');

exports.handler = (event, context, callback) => {
    console.log(event.queryStringParameters);
    console.log(event.body);
    const message = querystring.parse(event.body)
    if (event.queryStringParameters) {
        message.send_anyway = event.queryStringParameters.send_anyway
    }
    evaluate(message, (result) => {
        let response = {
            statusCode: 200,
            body: (result) ? JSON.stringify(result) : ""
        };

        callback(null, response);
    });
};
