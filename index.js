const AWS = require('aws-sdk');
// import individual service
// import comprehendClient = require('aws-sdk/clients/comprehend');

exports.handler = (event, context, callback) => {

    var message = JSON.parse(event.body);
    console.log(message);
    var comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'});
    var params = {
        Text: message.text,
        LanguageCode: 'en'
    };

    comprehend.detectSentiment(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
        console.log(data);

        const response = {
            statusCode: 200,
            body: JSON.stringify(data)
        };
        callback(null, response);
    }
    });

    // const response = {
    //     statusCode: 200,
    //     body: event.body
    // };
    // return response;
};
