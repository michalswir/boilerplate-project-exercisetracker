const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

// main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// connect with db
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("connected"))
  .catch(err => console.error("error", err));

// mongoose schemas
const userSchema = new mongoose.Schema({
  username: String
});
const exerciseSchema = new mongoose.Schema({
  user_id: String,
  username: String,
  description: String,
  duration: Number,
  date: Date,
});
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// create user
app.post('/api/users/', async (req, res) => {
  try {
    const username = req.body.username;
    const user = await new User({ username: username }).save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// create exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user_id = req.params._id;
    const user = await User.findById(user_id);
    const username = user.username;
    const { description, duration, date } = req.body;
    const exerciseDate = date ? new Date(date) : new Date();
    const exercise = await new Exercise({ user_id: user_id, username: username, description: description, duration: duration, date: exerciseDate }).save();
    const formattedDate = new Date(exercise.date).toDateString();
    res.json({ username: user.username, description: exercise.description, duration: exercise.duration, date: formattedDate, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// show all  users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// show all exerscises for users
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user_id = req.params._id;
    const user = await User.findById(user_id);
    const username = user.username;
    const { from, to, limit } = req.query;
    let filter = { user_id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lt = new Date(to);
    }
    const exercise = await Exercise.find({ user_id: user_id }).select('-_id description duration date').limit(limit ? parseInt(limit) : undefined).lean();
    exercise.forEach(exercise => exercise.date = new Date(exercise.date).toDateString());
    const log = exercise;
    console.log(log)
    res.json({
      username: username,
      count: log.length,
      _id: user_id,
      log: log.map(entry => ({
        description: entry.description,
        duration: entry.duration,
        date: entry.date
      }))
    });
  }
  catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//listening
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
