require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
// enable body parsing
const bodyParser = require("body-parser");
// enable dns lookup
const dns = require("dns");
const url = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

// setup mongoose
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// setup url pair mongoose scheme
let urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
    required: true,
  },
});
const Url = mongoose.model("urlPair", urlSchema);

app.use(cors());

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
// json responses
// app.use(express.json());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api/shorturl", bodyParser.urlencoded({ extended: false }));

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  let fixedUrl = url.parse(req.body.url).hostname;
  dns.lookup(fixedUrl, async (err, address) => {
    if (err || fixedUrl === null) {
      res.json({ error: "invalid url" });
    } else {
      const foundDoc = await Url.findOne({ original_url: req.body.url });
      if (!foundDoc) {
        let lastDoc = await Url.find().sort({ short_url: -1 }).limit(1);
        let newUrl = {};
        if (lastDoc.length === 0) {
          newUrl = { original_url: req.body.url, short_url: 1 };
        } else {
          let lastShort = lastDoc[0].short_url;
          newUrl = { original_url: req.body.url, short_url: lastShort * 1 + 1 };
        }
        const result = await Url.create(newUrl);
        res.json({
          original_url: result.original_url,
          short_url: result.short_url,
        });
      } else {
        res.json({
          original_url: foundDoc.original_url,
          short_url: foundDoc.short_url,
        });
      }
    }
  });
});

app.get("/api/shorturl/:index", async (req, res) => {
  const index = req.params.index * 1;
  const foundDoc = await Url.findOne({ short_url: index });
  if (!foundDoc) {
    res.json({ error: "invalid url" });
  } else {
    res.redirect(foundDoc.original_url);
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
