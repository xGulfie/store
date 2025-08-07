const hound = require('hound')
const childProcess = require('child_process')
var express = require('express')
var serveStatic = require('serve-static')
const process = require('process')

function build(){
    var proc = childProcess.spawn('sh',['build.sh'])
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    // don't really care if it exits 1 lol
}
const watcher=hound.watch('src')
watcher.on('create',build)
watcher.on('change',build)
build()

var app = express()
app.use(serveStatic('dist', { index: ['index.html'] }))
app.listen(3000,function(){console.log('listening on :3000')})