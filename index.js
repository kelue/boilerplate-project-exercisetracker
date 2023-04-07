const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')

//connect mongodb using mongoose
const mongoose = require('mongoose');
const { MONGO_URI } = process.env;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true
  },
  count: { type: Number, default: 0 },
  log:[{
    description: { type: String },
    duration: { type: Number },
    date: { type: String }
  }],
  
}, {versionKey: false})

let User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Create new user
app.post("/api/users", async (req, res) => {

  let username = req.body.username

  const userData = new User({username: username})

  const newUser = await userData.save()

  res.json({
    username: newUser.username,
    _id: newUser._id
  })
})

// get all the users
app.get("/api/users", async (req, res) => {
  const users = await User.find().select({username: 1, _id: 1}).exec()

  res.json(users)
})

//create new exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  let id = req.params._id
  const desc = req.body.description
  const duration = req.body.duration
  let date = req.body.date

  if(!date){
    date = new Date()
    date = date.toDateString()
  }else{
    date = new Date(date)
    date = date.toDateString()
  }

  const userData = await User.findById(id)

  userData.log.push({
    description: desc,
    duration: duration,
    date: date
  })

  userData.count = ++userData.count

  userData.save().then(updatedData => {

    let data = updatedData.log.slice(-1)[0]
    
    res.json({
      username: updatedData.username,
      description: data.description,
      duration: data.duration,
      date: data.date,
      _id: updatedData._id,
    })
  }).catch(error => console.error(error))
})

// get all users logs
app.get("/api/users/:_id/logs", async (req, res) => {

  const id = req.params._id

  const {from, to, limit } = req.query

  let userLogs = await User.findById(id, {"log._id": 0})

  let logs = userLogs.log

  if(from){
    logs = logs.filter(entry => new Date(entry.date) >= new Date(from))
  }
  if(to){
    logs = logs.filter(entry => new Date(entry.date) <= new Date(to))
  }
  if(limit){
    logs = logs.slice(0, limit)
  }

  console.log({
    username: userLogs.username,
   _id: userLogs.id,
   count: userLogs.count,
    log: logs
  })

  res.json({
    username: userLogs.username,
   _id: userLogs.id,
   count: userLogs.count,
    log: logs
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
