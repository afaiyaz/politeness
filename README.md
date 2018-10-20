Politeness API
==============

An AWS Lambda project in node to front for the AWS Comprehend API, intended to integrate with the Slack API. This project interprets results, and provides feedback on messages, indicating an error if the message content exceeds a certain threshold.

Written for the 2018 Nexient Hackathon v4

## Politeness API

## Local setup

* Install Docker https://www.docker.com/get-started
* Install sam-cli https://docs.aws.amazon.com/lambda/latest/dg/sam-cli-requirements.html

Start with `sam local start-api`

Send your JSON to:

POST http://127.0.0.1:3000/politeness-api

```
curl -X POST \
  http://127.0.0.1:3000/politeness-api \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: 883cea02-0b77-4464-bb17-0e8914f1a004' \
  -H 'cache-control: no-cache' \
  -d '{
    "challenge": "bang"
}'
```

# Authors
 * Atif Faiyaz
 * Nathan Thomas
 * Ziye Wang
