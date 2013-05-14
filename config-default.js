exports.setting = {
    name: 'smallweb server',
    webroot: 'c:\\dev\\web',
    layout: true, // if true, use layout.html as layout file
    cache: false, // if true, html/template is cached
    port: 8888,
    location: {
        lib: 'c:\\dev\\lib'
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