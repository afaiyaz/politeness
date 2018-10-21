const AWS = require('aws-sdk');
const request = require('request');

const evaluate = (message, callback) => {
    getUserOauth(message)
    .then((oauthResult) => {
        console.log("*** Oauth Result ***", oauthResult);

        const oauth = ((oauthResult.Item || {}).access_token || {}).S;
        if (!oauth) {
            let client_id = process.env.CLIENT_ID;
            let team = message.team_id;
            let response = {
                text: `It looks like you haven't agreed to use this app, please click here to continue: https://slack.com/oauth/authorize?client_id=${client_id}&scope=chat:write:user&team=${team}`
            }

            console.log('Rejecting user for no oauth token', response);
            callback(response);
            throw new Error('No oauth token for user');
        }

        return {
            ...message,
            oauth
        };
    })
    .then(fetchResults)
    .then((fetchedResults) => evaluateResults(message, fetchedResults))
    .then((evaluatedResults) => {
        console.log('evaluatedResults: ', evaluatedResults);
        if (!evaluatedResults.too_negative) {
            sendMessageAsUser(evaluatedResults);
            // callback({"success": "you did a thing"});
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
        TextList: message.text.split('.').filter(i => i.length),
        LanguageCode: 'en'
    };

    return new Promise((resolve, reject) => {
        comprehend.batchDetectSentiment(params, function(err, data) {
            if (err) reject(err);
            else resolve({...message, ...data});
        });
    })
}

// result.SentimentScore.Negative >= 0.5
const evaluateResults = (message, result) => {
    console.log('*** evaluating results ***', JSON.stringify(result));
    const negativeResults = result
      .ResultList
      .map((elem, index) => ({
        negativityScore: elem.SentimentScore.Negative,
        text: message.text.split('.').filter(i => i.length)[index],
      }))
      .filter(obj => obj.negativityScore >= 0.5);
    if (!negativeResults.length) {
      return {
        ...result,
        message: message.text,
        too_negative: false,
        text: 'Good for you, keep it positive!',
        color: '#3AA3E3',
      };
    }
    const negativeSentences = negativeResults.map(({text}) => text);
    return {
      ...result,
      message: message.text,
      too_negative: true,
      text: `We really think you can rephrase the following sentences. """${negativeSentences.join(', ')}"""`,
      color: '#FF0000',
    };


    // if (result.SentimentScore.Negative >= 0.5) {
    //     return {
    //         ...result,
    //         message: message.text,
    //         too_negative: true,
    //         text: 'Your message was too negative, please review before sending',
    //         color: '#FF0000',
    //     };
    // } else {
    //     return {
    //         ...result,
    //         message: message.text,
    //         too_negative: false,
    //         text: 'Good for you, keep it positive!',
    //         color: '#3AA3E3',
    //     };
    // }
    return {
            ...result,
            message: message.text,
            too_negative: true,
            text: 'Your message was too negative, please review before sending',
            color: '#FF0000',
        };
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
