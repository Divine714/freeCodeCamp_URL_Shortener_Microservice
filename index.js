require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
// for database to store urls
const {MongoClient, createIndex} = require("mongodb");
const dns = require("dns");
const urlparser = require("url");
const mongo =new MongoClient(process.env.database)
const database = mongo.db("Urlshortener")
const collection = database.collection("url")

// Basic Configuration
const port =process.env.PORT || 3000;



app.use(cors());

// middleware for getting unencypted url
app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// write post
app.post("/api/shorturl", (req, res) => {
  const url = req.body.url

  const dnsLookup = dns.lookup(urlparser.parse(url).hostname, 
async (error, address) => {
  if (!address) {
    res.json({ error: "Invalid URL" })
  } else {
    const count = await collection.countDocuments({})+ 1 ;
    
    const result = await collection.findOneAndUpdate(
      { "url" : `${url}` },
      {
        $setOnInsert: { short_url: count},
      },
      {
        returnOriginal: true,
        upsert: true,
      }
    );
    if(result) {
      res.json({ original_url: url, short_url: result.short_url });
    } else {
      res.json({ original_url: url, short_url: count });
    }   
   }
  })
});

// get with short_url
app.get("/api/shorturl/:input", async(req, res) =>{
  const input = req.params.input;
  const shortUrl = await collection.findOne({ short_url : +input });
  res.redirect(shortUrl.url)
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
