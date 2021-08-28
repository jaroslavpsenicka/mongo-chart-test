const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const mongoose = require('mongoose');
const cache = require('route-cache');

const MONGODB_URL = process.env.MONGODB_URL
const PORT = process.env.PORT || 8080
const ONE_HOUR = 1000 * 60 * 60
const ONE_DAY = ONE_HOUR * 24
const ONE_MONTH = ONE_DAY * 30
const ONE_YEAR = ONE_DAY * 365

const ID_QUERIES = {
  month: {
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" }
  },
  day: {
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" }
  },
  hour: {
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" },
    hour: { $hour: "$timestamp" }
  },
  minute: {
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" },
    hour: { $hour: "$timestamp" },
    minute: { $minute: "$timestamp" }
  },
  second: {
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" },
    hour: { $hour: "$timestamp" },
    minute: { $minute: "$timestamp" },
    second: { $second: "$timestamp" }
  }
}

const QCMP = {
  month: 1/24/30,
  day: 1/24,
  hour: 1,
  minute: 60,
  second: 3600
}

const MAX_QCMP = 1500

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("."));

mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Events = mongoose.model('Events', new mongoose.Schema({
  sensor: String, 
  timestamp: Date,
  value: Number,
}), 'events');

const eventsRouter = express.Router();
const cacheKey = (req) => `${req.params.shortCode}-${req.params.sensor}-${req.params.from}-${req.params.to}-${req.query.precision}`
const guessPrecision = (from, to) => {
  const timeDiff = to.getTime() - from.getTime()
  if (timeDiff < ONE_HOUR) return 'second'
  if (timeDiff < ONE_DAY) return 'minute'
  if (timeDiff < ONE_MONTH) return 'hour'
  if (timeDiff < ONE_YEAR) return 'day'
  return 'month'
}

eventsRouter.get('/:shortCode/:sensor/from/:from/to/:to', cache.cacheSeconds(20, cacheKey), (req, res) => {
  const shortCode = Number(req.params.shortCode)
  const sensor = req.params.sensor
  const from = new Date(req.params.from)
  const to = new Date(req.params.to)
  const precision = req.query.precision || guessPrecision(from, to)

  const qCmp = (to.getTime() - from.getTime()) / ONE_HOUR * QCMP[precision]
  if (qCmp > MAX_QCMP) {
    return res.status(400).json({ error: `max query complexity ${MAX_QCMP} exceeded: ${qCmp}` });
  }

  const match = { 
    "hub.shortCode": shortCode,
    "sensor": sensor,
    "timestamp": { $gte: from, $lte: to }
  }
  const group = { 
    _id: ID_QUERIES[precision], 
    timestamp: { $min: "$timestamp" },
    value: { "$avg": "$value" }
  }
  const project = {
    _id: 0,
    timestamp: "$timestamp",
    value: "$value" 
  }

  Events.aggregate([{ $match: match }, { $group: group }, { $project: project }], (err, data) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json(data);
  })
});

app.use("/api/events", eventsRouter);

app.listen(PORT);
