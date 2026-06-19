import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatOllama } from "@langchain/ollama";
import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
// Load environment variables
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Main route
app.get('/', async (req, res) => {
  try {
    const prompt = req.query.prompt || "Hello, how are you?";
    
    const model = new ChatOllama({
      model: "gemma4:31b-cloud", // Matches locally available model
      baseUrl: "http://127.0.0.1:11434", // Local Ollama server address
    });

    const result = await model.invoke(["human", "hello how are you ?"]);
    console.log(result);
    res.send(result.content);
  } catch (error) {
    console.error("Error during model invocation:", error);
    res.status(500).send({
      error: "Failed to invoke Ollama model",
      details: error.message
    });
  }
});
// Real LLM Graph Setup
const ollamaModel = new ChatOllama({
  model: "gemma4:31b-cloud",
  baseUrl: "http://127.0.0.1:11434",
});

const tools = [];
const toolNode = new ToolNode(tools);

// Bind tools to the model
const modelWithTools = ollamaModel.bindTools(tools);

const llmNode = async (state) => {
  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
};

const llmGraph = new StateGraph(MessagesAnnotation)
  .addNode("llm", llmNode)
  .addNode("tools", toolNode)
  .addEdge(START, "llm")
  .addConditionalEdges("llm", toolsCondition)
  .addEdge("tools", "llm")
  .compile();

app.get('/llm', async (req, res) => {
  try {
    const prompt = req.query.prompt || "are you llm";
    const result = await llmGraph.invoke({ messages: [{ role: "user", content: prompt }] });
    const lastMessage = result.messages[result.messages.length - 1];
    res.send(lastMessage.content);
  } catch (error) {
    console.error("Error during LLM graph invocation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


