exports.setting = {
    name: 'SmallWeb Server',
    webroot: 'web', // can use absolute path, for example: 'c:\\dev\\web',
    layout: true, // if true, use layout.html as layout file
    cache: false, // if true, html/template is cached
    port: 8888,
    location: {
        lib: 'lib'  // can use absolute path, for example: 'c:\\dev\\lib'
    },
    module: {
        'hello': 'hello'
    },
    media_types: {
        // application
        'json': 'application/json',
        'js': 'application/javascript',
        'pdf': 'application/pdf',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'gzip': 'application/gzip',
        // image
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'gif': 'image/gif',
        'tif': 'image/tiff',
        // text
        'css': 'text/css',
        'htm': 'text/html',
        'html': 'text/html',
        'txt': 'text/plain',
        'csv': 'text/csv'
    },
    page: { // page-level variable 
        sitename: 'SmallWeb'
    }
}