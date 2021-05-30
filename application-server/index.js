const express = require("express")
const cors = require('cors');
const bodyParser = require("body-parser")
const {Client} = require('@elastic/elasticsearch')

const app = express()
app.use(bodyParser.json())

// allow our web application make requests to the server
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.listen(8000, () => {
  console.log("Listening for requests on port 8000")
})

const client = new Client({
  node: process.env.SERVICE_URI // never store access keys in repositories
})

// create a resource with REST
app.post("/locations", (req, res) => {
  // add a new document and make it searchable
  client.index({
    index: 'locations',
    body: {
      "id": req.body.id,
      "name": req.body.name,
      "description": req.body.description,
    }
  })
    .then(response => {
      return res.json({"message": "Indexing successful. A new entry added to the store"})
    })
    .catch(err => {
      return res.status(500).json({"Oops! Something went wrong, check this message: ": err})
    })
})

// retrieve a resource with REST
app.get("/locations", (req, res) => {

  // return search hits that match the query defined in the request
  client.search({
    index: 'locations',
    body: {
      query: {
        // using multi_match in order to search across two fields
        multi_match: {
          // using wildcard '*'
          query: `*${req.query.search}*`,
          type: "cross_fields",
          fields: ["name", "description"],
          operator: "and"
        }
      }
    }
  }).then(response => {
    const names = (response?.body?.hits?.hits || []).reduce((accumulator, currentValue) => {
      accumulator.push(currentValue._source.name);
      return accumulator;
    }, [])

    return res.json(names)
  })
    .catch(err => {
      return res.status(500).json({"Oops! Something went wrong, check this message: ": err})
    })
})



