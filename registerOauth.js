const AWS = require('aws-sdk');
const request = require('request');

const registerOauth = (code, callback) => {
    console.log(code);
    getToken(code).then((accessTokenResult) => {
        console.log('Result from slack');
        console.log(accessTokenResult);
        return accessTokenResult;
    })
    .then(saveToken)
    .then((saveTokenResult) => {
        console.log(saveTokenResult);
        callback();
    });
};

const getToken = async (code) => {
    return new Promise((resolve, reject) => {
        request.post('https://slack.com/api/oauth.access', {
            form: {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code: code
            }
        }, (err, res, body) => {
            if (err) reject(err);
            else resolve(body);
        });
    });
}

const saveToken = async (accessTokenResult) => {
    var parsedTokenResult = JSON.parse(accessTokenResult);
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    var params = {
     ExpressionAttributeNames: {
      "#TN": "team_name",
      "#AT": "access_token"
     },
     ExpressionAttributeValues: {
     ":tn": {
        S: parsedTokenResult.team_name
       },
      ":at": {
        S: parsedTokenResult.access_token
       }

     },
     Key: {
      "user_id": {
        S: parsedTokenResult.user_id
       }
     },
     ReturnValues: "ALL_NEW",
     TableName: "politeness-oauth",
     UpdateExpression: "SET #TN = :tn, #AT = :at"
    };

    return new Promise ((resolve, reject) => {
        dynamodb.updateItem(params, function(err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

module.exports = registerOauth;