const https = require('https')
const fs = require('fs')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')

const serve = serveStatic('./dist/')

const options = {
    key: fs.readFileSync('server/key.pem'),
    cert: fs.readFileSync('server/cert.pem')
}

const server = https.createServer(options, (req, res) => {
    const done = finalhandler(req, res)
    serve(req, res, done)
})

server.listen(3000)