var engine = {
    name: 'hello',
    init: function() {
        console.log('hello engine init');
    },
    process: function(uri, request, response) {
        response.write('Hello there: ' + uri);
        response.end();
    }
}

module.exports = engine;