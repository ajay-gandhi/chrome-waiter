const CDP = require("chrome-remote-interface");
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { spawn } = require("child_process");

const PORT = 8000;

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static("public"));

app.get("/socket.js", (req, res) => {
  res.sendFile(`${__dirname}/node_modules/socket.io-client/dist/socket.io.js`);
});

server.listen(PORT, () => console.log(`[SERVER] Server listening on ${PORT}`));

/********************************** Chromium **********************************/

const chromePath = "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome";
const opts = "--headless --remote-debugging-port=9222";

const chrome = spawn(chromePath, opts.split(" "));
chrome.stdout.on("data", data => console.log("[CHROME]", data.toString()));
chrome.stderr.on("data", data => console.log("[CHROME] err", data.toString()));
chrome.on("close", code => console.log("[CHROME] exited", code));

process.on("exit", () => {
  console.log("Killing children");
  chrome.kill();
});

/**************************** Chromium Interactions ***************************/

setTimeout(async () => {
  let client;
  try {
    // Connect to Chromium
    client = await CDP();
    const { Page } = client;

    await Page.enable();
    await Page.navigate({ url: "https://kaleidosync.herokuapp.com/" });
    await Page.startScreencast();
    await Page.loadEventFired();

    while (true) {
      const { data, metadata, sessionId } = await Page.screencastFrame();
      io.emit("image", { data });
      await Page.screencastFrameAck({ sessionId: sessionId });
    }

  } catch (err) {
    console.error("[REMOTE]", err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}, 5000);
