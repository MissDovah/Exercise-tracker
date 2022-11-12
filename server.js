/* Credit for find().exec() - https://stackoverflow.com/a/67984074/15329048 */
/* Credit for the last test case - https://forum.freecodecamp.org/t/exercise-tracker-cant-pass-the-last-test/379293/8 */

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const moment = require("moment");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI);

app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new Schema({
  id: { type: String, required: true },
  username: { type: String, required: true },
  date: { type: String },
  duration: { type: Number, required: true },
  description: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", function(req, res) {
  let user = new User({ username: req.body["username"] });

  user.save(function() {
    res.json({
      username: user.username,
      _id: user.id,
    });
  });
});

app.get("/api/users", function(req, res) {
  User.find().exec(function(err, user) {
    return res.send(user);
  });
});

app.post("/api/users/:_id/exercises", function(req, res) {
  User.findById(req.params["_id"], function(err, docs) {
    if (req.body["date"] != "") {
      let exercise = new Exercise({
        id: req.params["_id"],
        username: docs.username,
        date: moment(req.body["date"]).format("ddd MMM DD YYYY"),
        duration: parseInt(req.body["duration"]),
        description: req.body["description"],
      });

      exercise.save(function() {
        res.json({
          _id: req.params["_id"],
          username: docs.username,
          date: moment(req.body["date"]).format("ddd MMM DD YYYY"),
          duration: parseInt(req.body["duration"]),
          description: req.body["description"],
        });
      });
    } else {
      let exercise = new Exercise({
        id: req.params["_id"],
        username: docs.username,
        date: moment().format("ddd MMM DD YYYY"),
        duration: parseInt(req.body["duration"]),
        description: req.body["description"],
      });

      exercise.save(function() {
        res.json({
          _id: req.params["_id"],
          username: docs.username,
          date: moment().format("ddd MMM DD YYYY"),
          duration: parseInt(req.body["duration"]),
          description: req.body["description"],
        });
      });
    }
  });
});

app.get("/api/users/:_id/logs", function(req, res) {
  Exercise.find({ id: req.params["_id"] }).exec(function(err, exercise) {
    if (req.query.from && req.query.to) {
      exercise =
        exercise.filter(
          (i) => Date.parse(i.date) > Date.parse(req.query.from)
        ) &&
        exercise.filter((i) => Date.parse(i.date) < Date.parse(req.query.to));
    }

    if (req.query.limit) {
      exercise = exercise.slice(0, req.query.limit);
    }

    User.findById(req.params["_id"], function(err, docs) {
      if (err) return console.log(err);

      res.json({
        username: docs.username,
        count: exercise.length,
        _id: req.params["id"],
        log: exercise,
      });
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
