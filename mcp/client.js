import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, ToolMessage } from "langchain";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. MCP server se connect karo
const client = new Client({ name: "weather-app", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [path.join(import.meta.dirname, "index.js")],
  })
);

// 2. MCP tools fetch karke AI pe bindTools lagao
const { tools } = await client.listTools();
const ai = new ChatGroq({ model: "openai/gpt-oss-20b" }).bindTools(
  tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }))
);

// 3. Routes
app.get("/", (req, res) => {
  res.json({ status: "ok", tools: tools.map((t) => t.name) });
});

app.post("/chat", async (req, res) => {
  try {
    const messages = [new HumanMessage(req.body.message)];
    let reply = await ai.invoke(messages);

    // Agar AI tool call kare, toh MCP server se run karke result wapas AI ko bhejo
    while (reply.tool_calls?.length) {
      messages.push(reply);
      for (const call of reply.tool_calls) {
        const result = await client.callTool({ name: call.name, arguments: call.args });
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: result.content?.[0]?.text ?? JSON.stringify(result),
          })
        );
      }
      reply = await ai.invoke(messages);
    }

    res.json({ reply: reply.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
