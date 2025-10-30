const express = require('express');
const app = express();
const port = 8000; 


const dbHost = process.env.POSTGRES_HOST;
const dbUser = process.env.POSTGRES_USER;

app.get('/', (req, res) => {
  res.send(`
    <h1>Chat Core API is Running! (Node.js)</h1>
    <p>Database Host: ${dbHost}</p>
    <p>Database User: ${dbUser}</p>
    <p>API is communicating with the container network successfully.</p>
  `);
});

app.listen(port, () => {
  console.log('Chat Core API listening at port ' + port); 
});
