# Fintech Devcon Workshop: Leveraging LLMs and Proactive Messaging for Member Support

Welcome! This git repo is for a Fintech Devcon 2023 Workshop on "Leveraging LLMs and Proactive Messaging for Member Support". This workshop is led by [Joe Emison](https://www.linkedin.com/in/joemastersemison/) and [Arvind Sontha](https://www.linkedin.com/in/arvind-sontha/).

## Objective

By the end of this workshop, you will have a microservice deployed on Fly.io that can provide high quality answers to questions about Branch Insurance, just like a Branch Insurance Support Agent would.

- Node.js/Express Microservice
- Deployed on fly.io
- Able to answer specific questions about Branch

## Prerequisites

In order to get started, you'll need to make sure you have the following:
- Node Version 18
- OpenAI API Key (Create an account [here](https://openai.com/))
- fly.io Account (Start [here](https://fly.io/docs/hands-on/install-flyctl/))

Additional Recommended Tools:
- [Postman](https://www.postman.com/downloads/) 

## Step 1 - Running locally

In order the service running simply use `nodemon index.js`. `nodemon` will watch for changes and then automatically refresh our local instance every time we save a file.

Now to make sure everything works, let's place an API request. In order to place API requests, I like to use [Postman](https://www.postman.com/downloads/) but you can also use `curl` like so:
```
 curl -H 'Content-Type: application/json' \
      -X POST \
      localhost:8080/answer
```

If everything works, you should be able to place a POST request to /answer and you should receive a response like so:
```
{
    "message": "Hello World!"
}
```

## Step 2 - Defining our Request and Response Body

Given that we're creating a microservice that can answer questions, let's define our Request and Response Body like so:

Request:
```
{
  "question": "What is branch?"
}
```

Response:
```
{
  "answer": "The answer to \"What is branch?\" is..."
}
```

Once you're done, the `answerHandler` function in `./routes/answer/index.js` should look something like this:
```
async function answerHandler(req, res) {
  
  const question = req.body.question;

  res.status(200).send({ answer: `The answer to "${question}" is...` });
}
```

## Step 3 - Connecting to OpenAI

Alright, time to start looping in some LLM magic.

First, install let's install OpenAI's 

## Step 3 - Adding 