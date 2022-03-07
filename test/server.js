const express = require('express');
const { readFileSync } = require('fs');
const { join } = require('path');
const app = express();
const port = 4000;

function getStaticResponseFile(url) {
  switch (url) {
    case '':
    case '/':
      return join(__dirname, 'app/index.html');
    case '/main.js':
      return join(__dirname, 'app/main.js');
    case '/my-script':
      return join(__dirname, 'app/my-script.js');
    default:
      null;
  }
}

app.use((req, res) => {
  const useMetaCsp = req.url.startsWith('/meta-csp');
  const url = req.url.replace(new RegExp('^/meta-csp'), '');

  console.log('Incoming request', req.url, url);

  // We are not using express.static to serve the static files, because it doesn't allow us to modify the body before
  // sending the static content back to browser.
  const file = getStaticResponseFile(url);
  if (!file) return res.status(400);

  let content = readFileSync(file).toString();
  if (useMetaCsp) {
    if (url === '/') {
      content = content.replace(
        `<!-- <meta http-equiv='Content-Security-Policy' content="require-trusted-types-for 'script'; trusted-types my-policy;"> -->`,
        `<meta http-equiv='Content-Security-Policy' content="require-trusted-types-for 'script'; trusted-types my-policy;">`
      );
    }
  } else {
    res.set('Content-Security-Policy', "require-trusted-types-for 'script'; trusted-types my-policy;");
  }

  return res.send(content).status(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
