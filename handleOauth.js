const evaluate = require('evaluate');
const querystring = require('querystring');

exports.handler = (event, context, callback) => {
    // Currently stubbed to just echo
    console.log(event.body);
    // const message = querystring.parse(event.body)
    // evaluate(message.text, (result) => {
    //     const response = {
    //         statusCode: 200,
    //         body: event.body
    //     }

    //     callback(null, response);
    // });

    const response = {
        statusCode: 200,
        body: event.body
    }
    callback(null, response);
};
