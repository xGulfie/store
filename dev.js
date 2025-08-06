const hound = require('hound')
const childProcess = require('child_process')
var express = require('express')
var serveStatic = require('serve-static')

function build(){
    childProcess.spawn('sh',['build.sh'])
}
const watcher=hound.watch('src')
watcher.on('create',build)
watcher.on('change',build)
build()

var app = express()
app.use(serveStatic('dist', { index: ['index.html'] }))
app.listen(3000,function(){console.log('listening on :3000')})