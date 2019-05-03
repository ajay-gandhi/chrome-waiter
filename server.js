const CDP = require("chrome-remote-interface");
const http = require("http");
const fs = require("fs");

// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless --remote-debugging-port=9222

const PORT = 3000;

let image;
async function example() {
  let client;
  try {
    // connect to endpoint
    client = await CDP();
    // extract domains
    const { Page } = client;
    // enable events then start!
    await Page.enable();
    await Page.navigate({url: "https://kaleidosync.herokuapp.com/"});
    await Page.startScreencast();
    await Page.loadEventFired();
    console.log("leggo");

    while (true) {
      const { data, metadata, sessionId } = await Page.screencastFrame();
      console.log(metadata);
      image = data;
      await Page.screencastFrameAck({ sessionId: sessionId });
    }

  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}
example();

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    fs.readFile('./index.html', function(error, content) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
    });
  } else if (req.url === "/image") {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ imageData: image }));
  } else {
    res.end("no");
  }
});

server.listen(PORT, (err) => {
  if (err) console.trace(err);
  console.log(`Server is listening on ${PORT}`)
});
