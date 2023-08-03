require("dotenv").config();
const express = require('express')
const cors = require('cors');
const answerRouter = require('./routes/answer');

// Initialize app
const app = express()
// Get port, or default to 8080
const PORT = process.env.PORT || 8080;

// For parsing application/json
app.use(express.json());

// Add CORS
app.use(cors({ origin: '*' }));

app.use('/answer', answerRouter);
 
app.listen(PORT, () => {
  console.log('Server started! Listening on port', PORT);
});
