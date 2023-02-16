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

app.post("/api/shorturl", (req, res) => {
  let urlWOprotocol = req.body.original_url.match(/\/\/([a-z, A-Z, ., \/]*)/);
  console.log(urlWOprotocol);
  dns.lookup(urlWOprotocol[1], (err, data) => {
    if (err) {
      res.json({
        error: "invalid url",
      });
    } else {
      res.json({
        original_url: req.body.original_url,
        short_url: req.body.short_url,
      });
    }
  });
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  res.json({
    original_url: req.body.original_url,
    short_url: req.body.short_url,
  });
});

// you can use the function dns.lookup(host, cb) from the dns core module to verify a submitted URL.

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
