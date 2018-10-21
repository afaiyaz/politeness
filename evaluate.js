const AWS = require('aws-sdk');
const request = require('request');

const evaluate = (message, callback) => {
    getUserOauth(message)
    .then((oauthResult) => {
        console.log("*** Oauth Result ***", oauthResult);

        return {
            ...message,
            oauth: ((oauthResult.Item || {}).access_token || {}).S
        };
    })
    .then(fetchResults)
    .then(evaluateResults)
    .then((evaluatedResults) => {
        console.log('evaluatedResults: ', evaluatedResults);
        if (evaluatedResults.send_message) {
            sendMessageAsUser(evaluatedResults);
            callback(null);
        } else {
            callback(formatMessage(evaluatedResults));
        }
    });
};

const getUserOauth = async (message) => {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    var params = {
        TableName: 'politeness-oauth',
        Key: {
            user_id: {
                S: message.user_id
            }
        },
        ProjectionExpression: "access_token",
        ConsistentRead: true,
    };

    return new Promise ((resolve, reject) => {
        dynamodb.getItem(params, function(err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

const fetchResults = async (message) => {
    console.log('*** fetchResults ***', message);

    var comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'});
    var params = {
        Text: message.text,
        LanguageCode: 'en'
    };

    return new Promise((resolve, reject) => {
        comprehend.detectSentiment(params, function(err, data) {
            if (err) reject(err);
            else resolve({...message, ...data});
        });
    })
}

const evaluateResults = (message) => {
    console.log('*** evaluateResults ***', message);
    if (!message.oauth) {
        let client_id = process.env.CLIENT_ID;
        let team = message.team_id;
        response = {
            ...message,
            message: message.text,
            send_message: false,
            text: `It looks like you haven't agreed to use this app, please click here to continue: https://slack.com/oauth/authorize?client_id=${client_id}&scope=chat:write:user&team=${team}`,
            color: '#0099FF',
        };
    } else if (message.SentimentScore.Negative >= 0.5) {
        response = {
            ...message,
            message: message.text,
            send_message: false,
            text: 'Negative messages can hurt feelings, please reconsider',
            color: '#FF0000',
        };
    } else {
        response = {
            ...message,
            message: message.text,
            send_message: true,
            text: 'Good for you, keep it positive!',
            color: '#3AA3E3',
        };
    }

    return response;
};

const formatMessage = (message) => {
    console.log('*** formatMessage ***', message);

    let response = {
        text: message.text,
        attachments: [
            {
                text: message.message,
                fallback: "Something went wrong",
                callback_id: "wopr_game",
                color: message.color,
                attachment_type: "default",
                actions: [
                    {
                        name: "game",
                        text: (message.oauth) ? "Send Anyway" : "Try again",
                        style: "danger",
                        type: "button",
                        value: (message.oauth) ? "bad" : "try_again",
                    }
                ]
            }
        ]
    };

    if (message.oauth) {
        response.attachments[0].actions[0].confirm = {
                title: "Are you sure?",
                text: message.message,
                ok_text: "Yes",
                dismiss_text: "No"
            };
    }

    return response;
};

const sendMessageAsUser = (results) => {
    request.post('https://slack.com/api/chat.postMessage', {
        form: {
            token: results.oauth,
            channel: results.channel_id,
            text: results.message,
        }
    });
}

module.exports = evaluate;