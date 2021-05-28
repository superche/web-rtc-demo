var fs = require('fs');
var path = require('path');
var PUBLIC_URL = process.env.PUBLIC_URL;

var filePath = path.resolve(__dirname, '../build/index.html');
var htmlStr = fs.readFileSync(filePath).toString();

var jsRegexp = /src\=\"\/static\/js\/([^\>]+)\.js\"/g;
var jsMatch;
while ((jsMatch = jsRegexp.exec(htmlStr)) !== null) {
    // console.log('jsMatch', jsMatch);
    htmlStr = htmlStr.replace(jsMatch[0], `src="${PUBLIC_URL}/static/js/${jsMatch[1]}.js"`);
}

var cssRegexp = /href\=\"\/static\/css\/([^\>]+).css\"/g;
var cssMatch;
while ((cssMatch = cssRegexp.exec(htmlStr)) !== null) {
    // console.log('cssMatch', cssMatch);
    htmlStr = htmlStr.replace(cssMatch[0], `href="${PUBLIC_URL}/static/css/${cssMatch[1]}.css"`);
}

fs.writeFileSync(filePath, htmlStr);
