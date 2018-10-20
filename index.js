const evaluate = require('evaluate');

exports.handler = (event, context, callback) => {

    const message = JSON.parse(event.body);
    evaluate(message.text, (result) => {
        const response = {
            statusCode: 200,
            body: JSON.stringify(result)
        }

        callback(null, response);
    });
};
