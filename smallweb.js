var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var mu = require('mu2');    // mustache template engine

// Use setting file specified in command line argument
// Commandline usage: node smallweb.js <site>
var site = process.argv[2] || 'default';
var configFile = './config-' + site + '.js';
var setting = require(configFile).setting;
setting.layoutfile = path.join(setting.webroot, 'layout.html');

// load modules for dynamic data handling
var webModule = {};
for (var name in setting.module) {
    webModule[name] = require('./module/' + setting.module[name]);
}
for (var name in webModule) {
    webModule[name].init();
}

http.createServer(function(request, response) {
    
    if (setting.cache === false) {
        mu.clearCache();
    }
    var uri = url.parse(request.url).pathname;
    var handler = getHandler(uri, setting);
    
    if (handler.type === 'file') {
        processFile(handler.value, request, response);
    } else if (handler.type === 'module') {
        processModule(handler.value, request, response);
    }
}).listen(setting.port);

// show server start information on console
console.log('SmallWeb Server running at port: ' + setting.port);
console.log('  webroot: ' + setting.webroot);
for (var property in setting.location) {
    console.log('  ' + property + ': ' + setting.location[property]);
}

/**
 * Get filename base on uri
 *
 * The location of uri's first segment can be set in setting
 * For example: /lib can be set to load from 'C:\\dev\\lib'
 *
 * If uri's first segment is not set in setting,
 * web page will be loaded from setting.webroot folder
 */
function getHandler(uri, setting) {
    
    var pieces = uri.split('/');
    var segment1 = pieces.shift();
    var segment2 = '';
    var handler = {};
    
    // check if location match exists
    var filename = path.join(setting.webroot, uri)
    if (segment1 === '') {  // uri starts with '/'
        segment2 = pieces.shift();
        var seg2value = setting.location[segment2];
        if (seg2value) {
            filename = path.join(seg2value, pieces.join(path.sep));
        }
    }
    handler = { type:'file', value:filename };
    // check if module match exists
    if (webModule[segment2]) {
        handler = { type:'module', value:webModule[segment2] };
    }
    return handler;
}

/**
 * Render html file using mustache template engine
 *
 * Use layout file when setting.layout is true
 */
function renderHtmlFile(filename, response, setting) {
    // for layout case, read file content into setting.page then render
    if (setting.layout) {
        setting.page.content = '';
        var contentSteam = mu.compileAndRender(filename, setting.page);
        contentSteam.on('data', function (data) {
            setting.page.content += data.toString();
        });
        contentSteam.on('end', function() {
            var stream = mu.compileAndRender(setting.layoutfile, setting.page);
            stream.pipe(response);
        });
    } else {
        var stream = mu.compileAndRender(filename, setting.page);
        stream.pipe(response);
    }
}

function processFile(filename, request, response) {
    var uri = url.parse(request.url).pathname;
    fs.exists(filename, function(exists) {
        // return 404 if file doesn't exist
        if(!exists) {
            console.log(uri, '404');
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('404 Not Found\n');
            response.end();
            return;
        }
        // file exists, load file for output
        if (fs.statSync(filename).isDirectory()) {
            if (filename.charAt(filename.length -1) === path.sep) {
                filename += '/index.html';
            } else {
                // for request at folder name, permenant move to folder name + '/'
                console.log(uri, '301');
                response.writeHead(301, { 'Location': uri + path.sep });
                response.end();
            }
        }
        
        var extname = path.extname(filename);
        extname = extname.replace('.', ''); // remove . in extname
        if (extname === 'html') {
            // use mustache template engine for html file rendering
            console.log(uri, '200');
            renderHtmlFile(filename, response, setting);
        } else {
            // for non html file, output as binary file
            fs.readFile(filename, 'binary', function(err, file) {
                if(err) {
                    console.log(uri, '500');
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.write(err + '\n');
                    response.end();
                    return;
                }
                // media_types
                var contentType = setting.media_types[extname] || 'text/plain';
                console.log(uri, '200', extname, contentType);
                response.writeHead(200, { 'Content-Type': contentType });
                response.write(file, 'binary');
                response.end();
            });
        }
    });
}

function processModule(module, request, response) {
    var uri = url.parse(request.url).pathname;
    var pieces = uri.split('/');
    var temp = pieces.shift();
    var temp = pieces.shift();
    var moduleUri = pieces.join('/');
    
    console.log(uri, 'module:' + module.name);
    module.process(moduleUri, request, response);
}