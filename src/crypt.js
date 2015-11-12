import 'babel-polyfill'

import {createCipher, createDecipher, randomBytes} from 'crypto'
import {createReadStream, createWriteStream} from 'fs'
import {createGzip, createGunzip} from 'zlib'
import {files} from 'fs-walk'
import {join} from 'path'
import NodeRSA from 'node-rsa'
import promisePipe from 'promisepipe'
import {remove, move} from 'fs-promise'

const algorithm = 'aes-256-ctr'
const PASSWORD_LENGTH = 64

export function generatePasswordSecretPair(publicKey) {
  let key = new NodeRSA(publicKey)
  const password = randomBytes(PASSWORD_LENGTH).toString('hex')
  const secret = key.encrypt(password, 'base64')
  return {
    password, secret
  }
}

export function decryptPassword(privateKey, secret) {
  let key = new NodeRSA(privateKey)
  return key.decrypt(secret, 'ascii')
}

export function encryptFile(path, password) {
  const temp = `${path}.tmp`
  return promisePipe(
      createReadStream(path),
      createGzip(),
      createCipher(algorithm, password),
      createWriteStream(temp)
    )
    .then(remove(path))
    .then(move(temp, path))
}

export function decryptFile(path, password) {
  const temp = `${path}.tmp`
  return promisePipe(
      createReadStream(path),
      createDecipher(algorithm, password),
      createGunzip(),
      createWriteStream(temp)
    )
    .then(remove(path))
    .then(move(temp, path))
}

export function encryptDirectory(dir, password) {
  return new Promise((resolve, reject) => {
    files(dir, (basedir, filename, stat, next) => {
      const path = join(basedir, filename)
      encryptFile(path, password)
        .then(() => next())
        .catch(err => next(err))
    }, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export function decryptDirectory(dir, password) {
  return new Promise((resolve, reject) => {
    files(dir, (basedir, filename, stat, next) => {
      const path = join(basedir, filename)
      decryptFile(path, password)
        .then(() => next())
        .catch(err => next(err))
    }, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
