const express = require('express');
const app = express();

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/myEComm');

//user routes
const user_route = require('./routes/userRoutes');

app.use('/api', user_route)


app.listen(3000, function () {
  console.log("Server is ready");
})