# Fintech Devcon Workshop: Leveraging LLMs and Proactive Messaging for Member Support

Welcome! This git repo is for a Fintech Devcon 2023 Workshop on "Leveraging LLMs and Proactive Messaging for Member Support". This workshop is led by [Joe Emison](https://www.linkedin.com/in/joemastersemison/) and [Arvind Sontha](https://www.linkedin.com/in/arvind-sontha/).

## Objective

By the end of this workshop, you will have a microservice deployed on Fly.io that can provide high quality answers to questions about Branch Insurance, just like a Branch Insurance Support Agent would.

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

Since we're creating a microservice that can answer questions, let's define our request and response bodies like so:

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

In order to do that, let's update the `answerHandler` function in `./routes/answer/index.js` like so:
```
async function answerHandler(req, res) {
  
  const question = req.body.question;

  res.status(200).send({ answer: `The answer to "${question}" is...` });
}
```

## Step 3 - Connecting to OpenAI

Alright, time to start looping in some LLM magic.

### Install SDK and configure environment

First, let's install OpenAI's Node.js SDK:
```
npm install --save openai
```

Then, we need to set our OpenAI API Key in `.env`:
```
OPENAI_API_KEY=<Your OpenAI API Key>
```

### Configure SDK

Then we can configure the OpenAI SDK by adding the following code to the top of `./routes/answer/index.js` like so:
```
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
```

### Generate an answer

Awesome, now that we have the ability to call OpenAI, let's see what happens when we ask their LLM a question. We can do this by adding the following code inside of our `answerHandler` method and then returning that as part of the API response like so:
```
const question = req.body.question;

let prompt_messages = [{role: "user", content: question}];

const chatCompletion = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: prompt_messages,
});

const answer = chatCompletion.data.choices[0].message.content;

res.status(200).send({ answer: answer });
```

Now you have a direct line to calling OpenAI and if you ask it questions, you'll get LLM generated responses.

The problem is, **it has no idea what it's talking about**.

With a question like "What is branch insurance?" it provides a good response, but if we now ask it "what states is branch insurance available in?", it will come up with a new response each time. This is a common problem when developing with LLMs, known as hallucinations and is in no way acceptable to actually use when directly responding to customers, partners, etc.

So how do we fix it?

## Step 4 - Prompt Engineering and Adding Context

We can fix this by taking advantage of the system prompt to provide the LLM with more context before it tries to answer questions about Branch Insurance.

Start by adding a method called `buildPrompt` after where we define the `openai` client.

```
function buildPrompt(question) {
  return [
    {
      role: "system",
      content: `
You are a support agent for Branch Insurance that answers users questions.

Here's some additional information about Branch Insurance:
"""
What is Branch?
Hey there, we're Branch Insurance. We’re a tech-forward company led by insurance industry veterans from the largest insurance companies in the country. We started Branch because we knew there were so many ways to make insurance better by offering the easiest buying experience, creative customer discounts, and above all, restoring insurance back to its original intent: to be your best friend on your worst day. We refer to this as getting back to getting each other’s backs.

What makes Branch different?
Branch is home and auto insurance that’s easier to buy and actually built for savings. Getting insurance with Branch couldn’t be easier: just input your name and address and we can get you covered with a real price - no quotes or gimmicks. Unlike other insurance companies, Branch is actually structured to make insurance more affordable. In many states, we underwrite policies through Branch Insurance Exchange - our reciprocal insurance exchange. This means we’re able to eliminate a lot of overhead costs and pass savings along to our members. Even in states where Branch Insurance Exchange isn’t yet available, our unique community programs give our members the chance to save money by helping grow our community.

What is the Branch Insurance Exchange?
Branch Insurance Exchange is a reciprocal insurance company that we built to further our mission to make insurance better and more affordable.  Branch Insurance Exchange is owned by its members and professionally managed by Branch.  Branch Insurance Exchange has earned a Financial Stability Rating® of A, Exceptional, from Demotech, Inc.*  Click here for more information. 

Who is Everspan Insurance Company?
In some states where Branch Insurance Exchange does not currently operate, Branch Insurance sells insurance as an agent for Everspan Insurance Company.  Everspan is rated A- (Excellent) by AM Best.

Who is General Security National Insurance Company?
In some states where Branch Insurance Exchange does not currently operate, Branch Insurance sells insurance as an agent for General Security National Insurance Company (GSNIC), which is owned by SCOR, one of the largest reinsurance companies in the world.  GSNIC is rated A+ by AM Best.

Is Branch an insurance company or an insurance agency?
Branch is an insurance agency, but it also manages the Branch Insurance Exchange, which is a licensed insurance company. When you buy insurance from Branch Insurance, you're buying insurance underwritten by either Branch Insurance Exchange, General Security National Insurance Company, or Everspan Insurance Company, depending on where you live.  Regardless of which entity underwrites your policy, you’ll have access to the same great Branch member programs and services.

How long has Branch been doing business?
Branch was founded in 2017 by Steve Lekas and Joseph Emison. Steve is an insurance industry veteran, having spent the majority of his career at Allstate, while Joe started a number of technology companies. The two joined forces to start Branch, securing investment from Greycroft (the team behind Acorns, Boxed, Keeps, and Venmo) and Rise of the Rest (an investment company owned by Dan Gilbert, founder of Quicken Loans and the Rock Family of Companies as well as owner of the Cleveland Cavaliers).  

Where is Branch located?
Branch is headquartered in Columbus, Ohio and has team members located all over the country.

What products does Branch sell?
Branch offers auto, homeowners, renters and umbrella insurance. Because bundling policies with one insurance company is a great way to help customers save money, Branch makes it easier than ever.
"""
      `
    },
    {
      role: "user",
      content: question
    }
  ]
}
```

Then, let's set `prompt_messages` to what this new method creates like so:
```
let prompt_messages = buildPrompt(question);
```

Now, if we test out some questions, we see that with this additional context, the LLM hallucinates much less and can factually answer these questions.

