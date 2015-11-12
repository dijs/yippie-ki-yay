import express from 'express'
import keypair from 'keypair'
import {randomBytes} from 'crypto'

let app = express()

let db = {}

function guid() {
  return randomBytes(64).toString('hex')
}

app.get('/pair', (req, res) => {
  const pair = keypair()
  const id = guid()
  db[id] = {
    key: pair.private,
    paid: false
  }
  res.json({
    key: pair.public,
    id
  })
})

app.get('/pay/:id', (req, res) => {
  const {id} = req.params
  const entry = db[id]
  if (!entry) {
    return res.status(500).send('Bad ID')
  }
  db[id].paid = true
  res.json(true)
})

app.get('/key/:id', (req, res, next) => {
  const {id} = req.params
  const entry = db[id]
  if (!entry) {
    return res.status(404).send('Not found')
  }
  const {key, paid} = entry
  if (paid) {
    res.json(key)
  } else {
    res.status(500).send('You haven\'t paid yet')
  }
})

app.listen(5000)
