const AWS = require('aws-sdk');

const evaluate = (message, callback) => {
    fetchResults(message).then((result) => {
        callback(evaluateResults(message, result));
    });
};

const fetchResults = async (message) => {
    var comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'});
    var params = {
        Text: message,
        LanguageCode: 'en'
    };

    return new Promise((resolve, reject) => {
        // resolve(positiveData);
        comprehend.detectSentiment(params, function(err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    })
}

const evaluateResults = (message, result) => {
    let response = {...result};
    if (!result.SentimentScore) {
        response = {
            ...result,
            message: message,
            too_negative: false,
            text: 'We could not find a result for you, please try again',
            color: '#FFFF00',
        };
    } else if (result.SentimentScore.Negative >= 0.75) {
        response = {
            ...result,
            message: message,
            too_negative: true,
            text: 'Your message was too negative, please review before send',
            color: '#FF0000',
        };
    } else {
        response = {
            ...result,
            message: message,
            too_negative: false,
            text: 'Good for you, keep it positive!',
            color: '#3AA3E3',
        };
    }

    return formatMessage(response);
};

const formatMessage = (result) => ({
    text: result.text,
    attachments: [
        {
            text: result.message,
            fallback: "You are unable to choose a game",
            callback_id: "wopr_game",
            color: result.color,
            attachment_type: "default",
            actions: [
                {
                    name: "game",
                    text: "Do not send",
                    style: "danger",
                    type: "button",
                    value: "war",
                    confirm: {
                        title: "Are you sure you want to send this?",
                        text: result.message,
                        ok_text: "Yes",
                        dismiss_text: "No"
                    }
                }
            ]
        }
    ]
});

module.exports = evaluate;