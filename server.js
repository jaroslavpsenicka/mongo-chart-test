const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const mongoose = require('mongoose');
const cache = require('route-cache');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/lcs'
const PORT = process.env.PORT || 8080
const BUCKET_COUNT = 60

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("dist"));

mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Posts = mongoose.model('Posts', new mongoose.Schema({
  timestamp: Number,
  num_characters: Number
}), 'wikipedia');

const feedRouter = express.Router();
const cacheKey = (req) => `${req.params.from}-${req.params.to}-${req.query.buckets}`

feedRouter.get('/from/:from/to/:to', cache.cacheSeconds(20, cacheKey), (req, res) => {
  const from = Number(req.params.from)
  const to = Number(req.params.to)
  const buckets = (req.query.buckets || BUCKET_COUNT) - 1
  const match = { timestamp: { $gte: from, $lte: to }}
  const interval = Math.round((match.timestamp.$lte - match.timestamp.$gte) / buckets)
  const group = { 
    _id: { $round: [{ $divide: [{ $subtract: [ "$timestamp", from ]}, interval ]}]}, 
    avg: { $avg: "$num_characters" }
  }
  const project = { avg: { $round: ["$avg"] }}

  Posts.aggregate([{ $match: match }, { $group: group }, { $project: project }], (err, data) => {
    if (err) return res.status(500).json({ error: err });
    const values = data.sort((i1, i2) => i1._id-i2._id).map(i => i.avg)
    res.status(200).json({ from, to, interval, values });
  })
});

app.use("/api/feed", feedRouter);

app.listen(PORT);
