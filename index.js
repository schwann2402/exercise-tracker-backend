const express = require("express");
const app = express();
const cors = require("cors");
const { default: mongoose, Schema } = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then((res) => console.log("Connected to DB successfully"))
  .catch((error) => console.log(error));

const userSchema = new Schema({
  username: {
    type: String,
  },
});

const exerciseSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: String,
});
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//get all users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  if (users.length === 0) {
    res.send("There are no users");
  }
  res.json(users);
});
app.post("/api/users", async (req, res) => {
  const user = await User.create({ username: req.body.username });
  try {
    res.json(user);
    console.log(user);
  } catch (error) {
    console.log(error);
  }
});

//You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.send("The user with the given id was not found");
    }
    const exercise = await Exercise.create({
      user_id: user._id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
      _id: user._id,
    });
    // {
    //   username: "fcc_test",
    //   description: "test",
    //   duration: 60,
    //   date: "Mon Jan 01 1990",
    //   _id: "5fb5853f734231456ccb3b05"
    // }
  } catch (error) {
    console.log(error);
    res.send("There was an error logging the exercise");
  }
});

//GET /api/users/:_id/logs?
app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = User.findById(id);
  console.log(user);
  if (!user) {
    return res.send("Could not find user");
  }
  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id,
  };
  if (to || from) {
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  console.log(exercises);
  let log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString(),
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
