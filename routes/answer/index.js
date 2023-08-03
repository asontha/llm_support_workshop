const express = require('express')

async function answerHandler(req, res) { 
  res.status(200).send({ message: "Hello World!" });
}

const router = express.Router()

router.post('/', answerHandler);

module.exports = router