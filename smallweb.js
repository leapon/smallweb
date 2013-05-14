var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var mu = require('mu2');    // mustache template engine

/*
example setting file:
=====================
exports.setting = {
    name: 'smallweb server',
    webroot: 'c:\\dev\\web',
    layout: true, // if true, use layout.html as layout file
    port: 8001,
    location: {
        lib: 'c:\\dev\\lib'
    },
    page: { // page-level variable 
        sitename: 'smallweb'
    }
}
*/

// Use setting file specified in command line argument
// Commandline usage: node smallweb.js <site>
var site = process.argv[2] || 'default';
var configFile = './config-' + site + '.js';
var setting = require(configFile).setting;
setting.layoutfile = path.join(setting.webroot, 'layout.html');

http.createServer(function(request, response) {
    
    if (setting.cache === false) {
        mu.clearCache();
    }
    var uri = url.parse(request.url).pathname;
    var filename = getFilename(uri, setting);
    
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
function getFilename(uri, setting) {
    var pieces = uri.split('/');
    var segment1 = pieces.shift();
    var filename = path.join(setting.webroot, uri)
    if (segment1 === '') {  // uri starts with '/'
        var segment2 = pieces.shift();
        var seg2value = setting.location[segment2];
        if (seg2value) {
            filename = path.join(seg2value, pieces.join(path.sep));
        }
    }
    return filename;
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
