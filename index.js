require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// enable body parsing
const bodyParser = require("body-parser");
// enable dns lookup
const dns = require("node:dns");

// Basic Configuration
const port = process.env.PORT || 3000;

// setup mongoose
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api/shorturl", bodyParser.urlencoded({ extended: false }));

// timeout
const TIMEOUT = 10000;

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

let UrlPair = mongoose.model("urlPair", urlSchema);

// create and save helper function
const createAndSaveUrl = (original, short, done) => {
  let newpair = new UrlPair({
    original_url: original,
    short_url: short,
  });

  newpair.save((err, data) => {
    if (err) {
      console.log(err);
    }
    done(null, data);
  });
};

// save url pair to mongoose database
app.post("/api/shorturl", (req, res, next) => {
  // check if original url is valid
  let urlWOprotocol = req.body.original_url.match(
    /https?:\/\/([a-z, A-Z, 0-9, ., -]*)\/[a-z, A-Z, \?, =, 0-9, \/, ., -]*/
  );
  console.log("match: " + urlWOprotocol);
  if (urlWOprotocol === null) {
    return next(
      res.json({
        error: "invalid url",
      })
    );
  } else {
    dns.lookup(urlWOprotocol[1], (err, data) => {
      if (err) {
        return next(
          res.json({
            error: "invalid url",
          })
        );
      } else {
        console.log("create and save");
        // save to mongoose
        // in case of incorrect function use wait timeout then respond
        let t = setTimeout(() => {
          next({ message: "timeout" });
        }, TIMEOUT);
        createAndSaveUrl(
          req.body.original_url,
          req.body.short_url,
          function (err, data) {
            clearTimeout(t);
            if (err) {
              return next(err);
            }
            if (!data) {
              console.log("Missing `done()` argument");
              return next({ message: "Missing callback argument" });
            }
            UrlPair.findById(data._id, function (err, urlp) {
              if (err) {
                return next(err);
              }
              // respond
              return next(
                res.json({
                  original_url: req.body.original_url,
                  short_url: req.body.short_url,
                })
              );
            });
          }
        );
      }
    });
  }
});

const findUrlPairByShortUrl = (short, done) => {
  UrlPair.findOne({ short_url: short }, (err, data) => {
    done(null, data);
  });
};

// retrieve url pair and redirect
app.get("/api/shorturl/:shorturl", (req, res) => {
  findUrlPairByShortUrl(req.params.shorturl, function (err, data) {
    let t = setTimeout(() => {
      next({ message: "timeout" });
    }, TIMEOUT);
    clearTimeout(t);
    if (err) {
      console.log(err);
    }
    if (!data) {
      console.log("missing data");
    } else {
      console.log(data);
      let redirectUrl = data.original_url; // "https://" +
      res.redirect(redirectUrl);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
