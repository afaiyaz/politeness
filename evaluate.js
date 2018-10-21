const AWS = require('aws-sdk');
const request = require('request');

const evaluate = (message, callback) => {
    formatRequest(message)
    .then(getUserOauth)
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

const formatRequest = (message) => {
    console.log("****formatRequest****", message)
    return new Promise((resolve) => {
        if (message.payload) {
            let payload = JSON.parse(message.payload);
            resolve({
                text: payload.actions[0].value,
                token: payload.token,
                team_id: payload.team.id,
                team_domain: payload.team.domain,
                channel_id: payload.channel.id,
                channel_name: payload.channel.name,
                user_id: payload.user.id,
                user_name: payload.user.name,
                response_url: payload.response_url,
                trigger_id: payload.trigger_id,
                send_anyway: message.send_anyway,
            });
        } else {
            resolve(message);
        }
    });
}

const getUserOauth = async (message) => {
    console.log("***getUserOauth***", message);
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
            else {
                console.log("****OAUTH DATA****", data);
                let oauth;
                if (data.Item && data.Item.access_token && data.Item.access_token.S) {
                    oauth = data.Item.access_token.S;
                }
                resolve({...message, oauth})
            };
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
            else {
                console.log("******DATA*********", data.ResultList);
                resolve({...message, sentimentResult: data.ResultList});
            }
        });
    });
}

const evaluateResults = (message) => {
    console.log('*** evaluating message ***', JSON.stringify(message));

    if (!message.oauth) {
       let client_id = process.env.CLIENT_ID;
       let team = message.team_id;
       return {
           ...message,
           message: message.text,
           send_message: false,
           text: `It looks like you haven't agreed to use this app, please click here to continue: https://slack.com/oauth/authorize?client_id=${client_id}&scope=chat:write:user&team=${team}`,
           color: '#0099FF',
       };
    }
    const negativeResults = message
      .sentimentResult
      .map((elem, index) => ({
        negativityScore: elem.SentimentScore.Negative,
        text: message.text.split('.').filter(i => i.length)[index],
      }))
      .filter(obj => obj.negativityScore >= 0.5);

    console.log("*****negativeResults****", negativeResults);
    if (!negativeResults.length) {
      return {
        ...message,
        message: message.text,
        send_message: true,
        text: 'Good for you, keep it positive!',
        color: '#3AA3E3',
      };
    }
    const negativeSentences = negativeResults.map(({text}) => text);
    return {
      ...message,
      message: message.text,
      send_message: (message.send_anyway === 'true') ? true : false,
      text: `We really think you can rephrase the following sentences. "${negativeSentences.join(', ')}"`,
      color: '#FF0000',
    };
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
                        name: "send_anyway",
                        text: (message.oauth) ? "Send Anyway" : "Try again",
                        style: "danger",
                        type: "button",
                        value: message.message,
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