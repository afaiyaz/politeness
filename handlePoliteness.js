const evaluate = require('evaluate');
const querystring = require('querystring');

exports.handler = (event, context, callback) => {
    console.log(event.body);
    const message = querystring.parse(event.body)
    evaluate(message, (result) => {
        const response = {
            statusCode: 200,
            body: JSON.stringify(result)
        }

        callback(null, response);
    });
};
