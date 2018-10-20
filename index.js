const AWS = require('aws-sdk');

//Call aws comprehend API
const evaluateMessage = (message) =>({
    netrual:'20%',
    positive:'10%',
    negative:'70%'
});


const ziyeSlack = async (event) => {


    const responseBody = getFormattedMessage();

    const evalutaion = evaluateMessage();

    const response = {
        statusCode: 200,
        body: JSON.stringify(responseBody)

    };
    return response;
};

//Formatting response message
const getFormattedMessage = (message) =>({

     text: `Your message "${message}" too negative, please review before send`,
     attachments: [
        {
            text: "too negative",
            fallback: "You are unable to choose a game",
            callback_id: "wopr_game",
            color: "#3AA3E3",
            attachment_type: "default",
            actions: [
                {
                    name: "game",
                    text: "Do not send",
                    style: "danger",
                    type: "button",
                    value: "war",
                    confirm: {
                        title: "Are you sure?",
                        text: "This can really hurt feelings!",
                        ok_text: "Yes",
                        dismiss_text: "No"
                    }
                }
            ]
        }
    ]
});


exports.handler = (event, context, callback) => {

    const message = JSON.parse(event.body);
    var comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'});
    var params = {
        Text: message.text,
        LanguageCode: 'en'
    };

    comprehend.detectSentiment(params, function(err, data) {
      if (err) console.log(err, err.stack);
      else {
        console.log(data);

        const response = {
            statusCode: 200,
            body: JSON.stringify(data)
        };
        callback(null, response);
    }
    });

};
