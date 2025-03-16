#!/usr/bin/env node
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import crawlAgent from "./crawlAgent.js";
import ExcelBot from "./excelOperations.js";
import npmBot from "./npmAgent.js";
import openSourceBot from "./opensource.js";
const app = express();

const transportStore = new Map<string, Map<string, SSEServerTransport>>();
const appMap = new Map<string, McpServer>([
  // 在这里注册你的 server

  ["crawl_bot", crawlAgent],
  ["sheets_bot", ExcelBot],
  ["npm_bot", npmBot],
  ["opensource_bot", openSourceBot],
]);

app.get(`/:id/:name/sse`, async (req, res) => {
  const userId = req.params.id;
  const appName = req.params.name;

  if (!appMap.has(appName)) {
    res.status(404).send("App not found");
    return;
  }
  let userTransports = transportStore.get(userId);
  if (!userTransports) {
    userTransports = new Map();
    transportStore.set(userId, userTransports);
  }
  if (userTransports.has(appName)) {
    const transport = userTransports.get(appName);
    transport!.close();
  }
  console.log(`${userId} connected to ${appName}`);
  const port = new SSEServerTransport(`/${userId}/${appName}/message`, res);
  userTransports.set(appName, port);
  await appMap.get(appName)!.connect(port);
});

app.post(`/:id/:name/message`, async (req, res) => {
  const userId = req.params.id;
  const appName = req.params.name;
  if (!appMap.has(appName)) {
    res.status(404).send("App not found");
    return;
  }
  const transport = transportStore.get(userId)!;
  const app = transport.get(appName);
  console.log(`${userId} sent message to ${appName}`);
  if (app) {
    await app.handlePostMessage(req, res);
  }
});

app.listen(6798);
