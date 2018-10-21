const evaluate = require('evaluate');
const querystring = require('querystring');

exports.handler = (event, context, callback) => {
    console.log(event.body);
    const message = querystring.parse(event.body)
    evaluate(message, (result) => {
        let response = {
            statusCode: 200
        };

        if (result) {
            response.body = JSON.stringify(result);
        }
        // context.succeed(response);

        callback(null, response);
    });
};
