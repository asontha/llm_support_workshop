# Fintech Devcon Workshop: Leveraging LLMs and Proactive Messaging for Member Support

Welcome! This git repo is for a Fintech Devcon 2023 Workshop on "Leveraging LLMs and Proactive Messaging for Member Support". This workshop is led by [Joe Emison](https://www.linkedin.com/in/joemastersemison/) and [Arvind Sontha](https://www.linkedin.com/in/arvind-sontha/).

## Objective

By the end of this workshop, you will have a microservice deployed on [fly.io](https://fly.io) that can provide factually correct answers to simple questions about Branch Insurance.

## Prerequisites

In order to get started, you'll need to make sure you have the following:
- [Node Version 18](https://nodejs.org/en/download)
- [Docker](https://docs.docker.com/get-docker/)
- OpenAI API Key (Create an account [here](https://openai.com/))
- fly.io Account (Start [here](https://fly.io/docs/hands-on/install-flyctl/))

Additional Recommended Tools:
- [Postman](https://www.postman.com/downloads/) 

## Step 0 - Install Dependencies

To install dependencies, use:
```bash
npm install
```

## Step 1 - Running locally

To start the service, use:
```bash
node index.js
```

Now to make sure everything works, let's place an API request. In order to place API requests, I recommend using [Postman](https://www.postman.com/downloads/) but you can also use `curl` like so:
```bash
 curl -H 'Content-Type: application/json' \
      -X POST \
      localhost:8080/answer
```

If everything works, you should be able to place a POST request to /answer and you should receive a response like so:
```json
{
    "message": "Hello World!"
}
```

## Step 2 - Defining our Request and Response Body

Since we're creating a microservice that can answer questions, let's define our request and response bodies like so:

Request:
```json
{
  "question": "What is branch?"
}
```

Response:
```json
{
  "answer": "The answer to \"What is branch?\" is..."
}
```

In order to do that, let's update the `answerHandler` function in `./routes/answer/index.js` like so:
```js
async function answerHandler(req, res) {
  
  const question = req.body.question;

  res.status(200).send({ answer: `The answer to "${question}" is...` });
}
```

## Step 3 - Connecting to OpenAI

Alright, time to start looping in some LLM magic.

### Install SDK and configure environment

First, let's install OpenAI's Node.js SDK:
```bash
npm install --save openai
```

Then, we need to set our OpenAI API Key in `.env`:
```
OPENAI_API_KEY=<Your OpenAI API Key>
```

### Configure SDK

Then we can configure the OpenAI SDK by adding the following code to the top of `./routes/answer/index.js` like so:
```js
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
```

### Generate an answer

Awesome, now that we have the ability to call OpenAI, let's see what happens when we ask their LLM a question. We can do this by adding the following code inside of our `answerHandler` method and then returning that as part of the API response like so:
```js
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

We can fix this by taking advantage of a bit of prompt engineering to provide the LLM with more context before it tries to answer questions about Branch Insurance. OpenAI makes this simple by providing a `system` role.

Start by adding a method called `buildPrompt` after where we define the `openai` client.

```js
function buildPrompt(question) {
  return [
    {
      role: "system",
      content: `
You are a support agent for Branch Insurance that answers user's questions.

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
```js
let prompt_messages = buildPrompt(question);
```

Now, if we test out some questions, we see that with this additional context, the LLM has up to date information, hallucinates much less for questions that we've provided information about, and can factually answer these questions.

However, there are limitations. Unfortunately, most knowledge sets don't simply fit into the context windows of these LLM models and even if they did fit, it's expensive to use a model's entire context window for each and every single call both in terms of compute and latency.

Furthermore, in the case of Branch Insurance or any other regulated financial product, there are many nuances at the state level. Therefore, we need an algorithm that can cut through to the information that we need first before using the LLM to further refine our answer. 

## Step 5 - Retrieval Augmented Generation (RAG)

Retrieval Augmented Generation (RAG) is the process of first searching for the most relevant pieces of information before generating an answer using an LLM. In order to do so, we first create a search index, and then use the input query or question to search through that index.

### Initializing Our Search Index

For our search index, we'll be using a method known as semantic search. Semantic search differs from a standard keyword search in that it measures how similar two texts are based off of their meaning instead of exactly matching keywords. This is really useful in a member support setting as a lot of the time, users aren't entirely sure what they're asking for. 

Typically, semantic search indexes use a concept known as embeddings to accomplish measuring semantic similarity. Embeddings work by taking something in high dimensional space and reducing them to a lower dimensional space. For example, all of the colors of the universe are a high dimensional space, but we do a pretty good job of representing them using RGB values, which you can think of as a 3 dimensional vector. We then know colors are similar to each other if the distance between their RGB values is low. This is exactly what we're doing, just with large bodies of text.

First, let's install `vectra`, a local vector database for Node.js:
```bash
npm install --save vectra
```

Then, let's set up our index at the top of our endpoint:
```js
const { LocalIndex } = require('vectra');

const index = new LocalIndex('./index');
```

Now, let's do a lazy initialization of our index at the top of `answerHandler`:
```js
// Init search index
if (!await index.isIndexCreated()) {
    await index.createIndex();
    await loadIndex();
    console.log("Index loaded!");
}
```

Normally, we would preprocess and load our index offline using a datapipeline along with a hosted vector database.

And then define the `loadIndex` method along with it's helper methods like so. This will set up our index with the faq's provided in the `data` folder.
```js
async function getVector(text) {
  const response = await openai.createEmbedding({
      'model': 'text-embedding-ada-002',
      'input': text,
  });
  return response.data.data[0].embedding;
}

async function addItem(text) {
  await index.insertItem({
      vector: await getVector(text),
      metadata: { text }
  });
}

async function loadIndex() {

  const files = [
    'branch-faq.txt',
    'bundling-faq.txt',
    'car-insurance-faq.txt',
    'home-insurance-faq.txt',
    'personal-info-faq.txt'
  ]

  for(let file of files) {
    let text = fs.readFileSync(`./data/${file}`);
    await addItem(text.toString());
  }
}
```

We'll also need to import `fs` at the top:
```js
const fs = require('fs');
```

Now, if you run the server and place a request, you can see what we have in our index under the newly created `index` folder.

### Querying Our Index And Dynamic Prompt Context

Now, to get the most relevant content related to the question is simple.

First, let's add a new helper method to query our index:
```js
async function query(text) {
  const vector = await getVector(text);
  return index.queryItems(vector, 1);
}
```

And then we can update our endpoint handler to use the incoming question to fetch the related context and pass it over to our prompt builder:
```js

const question = req.body.question;

let relevant_context = await query(question);

let prompt_messages = buildPrompt(question, relevant_context);

```

Finally, we just need to update how we build our prompt like so:
```js
function buildPrompt(question, relevant_context) {
  return [
    {
      role: "system",
      content: `
You are a support agent for Branch Insurance that answers users questions.

Here's some additional information about Branch Insurance:
"""
${relevant_context[0].item.metadata.text}
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

And now, if we run the server, you can ask it a variety of questions from the provided data and you'll see that our system dynamically loads and switches content to try and answer questions.

## Step 6 - Deploying our service

Now that our service is ready, let's get it deployed!

### Initializing Our Fly Deployment

fly.io makes this super easy. To start, use this command:
```bash
fly launch
```

Once you're done, this will create three files: `fly.toml`, `Dockerfile`, and `.dockerignore`

Since our server runs on port 8080, we need to make a few small updates to `fly.toml` and `Dockerfile` like so:

`fly.toml`
```yaml
  internal_port = 8080
```

`Dockerfile`
```
EXPOSE 8080
```

### Configuring Secrets

Then we add our OpenAI API Key like so:
```bash
fly secrets set OPENAI_API_KEY=<Your OpenAI API Key>
```

### Deploying On Fly

And finally we deploy:
```bash
fly deploy
```

And that's it! Your microservice is deployed and running as configured.