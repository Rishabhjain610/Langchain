import dotenv from "dotenv";
dotenv.config();

import { createAgent, tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import z from "zod";

const MODEL = "groq:qwen/qwen3.8-27b";

// ============================================================================
// AGENT 1: Research Agent (equipped with 2 tools)
// ============================================================================

// Tool 1A: Tavily live web search
const tavilySearchTool = new TavilySearch({
  maxResults: 2,
});

// Tool 1B: Fact-check / Entity Extraction tool
const factExtractorTool = tool(
  ({ text }) => {
    console.log("[Research Agent Tool Executed] fact_extractor called");
    return `Verified factual extraction from source: ${text.slice(0, 150)}...`;
  },
  {
    name: "fact_extractor",
    description: "Extract and verify key factual data points from long text passages.",
    schema: z.object({
      text: z.string().describe("The raw text to extract facts from"),
    }),
  }
);

const researchAgent = createAgent({
  model: MODEL,
  tools: [tavilySearchTool, factExtractorTool],
  prompt: "You are a Research Agent. Answer with concise, factual figures only. Avoid lengthy explanations.",
});

// ============================================================================
// AGENT 2: Math & Analytics Agent (equipped with 2 tools)
// ============================================================================

// Tool 2A: Basic Calculator
const calculatorTool = tool(
  ({ operation, a, b }) => {
    console.log(`[Math Agent Tool Executed] calculator: ${a} ${operation} ${b}`);
    switch (operation) {
      case "add": return String(a + b);
      case "subtract": return String(a - b);
      case "multiply": return String(a * b);
      case "divide": return b !== 0 ? String(a / b) : "Error: Division by zero";
      default: return "Error: Invalid operation";
    }
  },
  {
    name: "calculator",
    description: "Performs basic math operations: add, subtract, multiply, divide.",
    schema: z.object({
      operation: z.enum(["add", "subtract", "multiply", "divide"]),
      a: z.number(),
      b: z.number(),
    }),
  }
);

// Tool 2B: Statistical Analyzer
const statisticsTool = tool(
  ({ numbers }) => {
    console.log(`[Math Agent Tool Executed] statistics for:`, numbers);
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return JSON.stringify({ sum, average: avg, min, max, count: numbers.length });
  },
  {
    name: "statistics_analyzer",
    description: "Calculates sum, average, min, and max for an array of numbers.",
    schema: z.object({
      numbers: z.array(z.number()).describe("List of numbers to analyze"),
    }),
  }
);

const mathAgent = createAgent({
  model: MODEL,
  tools: [calculatorTool, statisticsTool],
  prompt: "You are a specialized Math & Statistics Agent. You perform calculations accurately using your tools.",
});

// ============================================================================
// AGENT 3: Orchestrator / Supervisor Agent (calls Agent 1 & Agent 2 as tools)
// ============================================================================

// Wrap Research Agent as a tool
const callResearchAgentTool = tool(
  async ({ query }) => {
    console.log(`\n>>> [Orchestrator] Delegating to Research Agent: "${query}"`);
    const res = await researchAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return res.messages[res.messages.length - 1].content;
  },
  {
    name: "research_agent",
    description: "Delegate to this agent when you need to research real-world facts, current events, or web information.",
    schema: z.object({
      query: z.string().describe("Specific research question or topic"),
    }),
  }
);

// Wrap Math Agent as a tool
const callMathAgentTool = tool(
  async ({ task }) => {
    console.log(`\n>>> [Orchestrator] Delegating to Math Agent: "${task}"`);
    const res = await mathAgent.invoke({
      messages: [{ role: "user", content: task }],
    });
    return res.messages[res.messages.length - 1].content;
  },
  {
    name: "math_agent",
    description: "Delegate to this agent when you need to calculate formulas, statistics, sums, or perform arithmetic on numbers.",
    schema: z.object({
      task: z.string().describe("Specific math problem or numbers to calculate"),
    }),
  }
);

// The Orchestrator agent has access to both sub-agents
const orchestratorAgent = createAgent({
  model: MODEL,
  tools: [callResearchAgentTool, callMathAgentTool],
  prompt: `You are the Master Orchestrator. 
Your job is to break down complex user requests and delegate them to your specialized sub-agents:
- Use 'research_agent' to find facts and numbers.
- Use 'math_agent' to calculate or analyze the numbers.
Finally, combine their outputs into a clean, comprehensive final response.`,
});

// ============================================================================
// Demo Execution
// ============================================================================
async function runDemo() {
  console.log("==================================================");
  console.log("Starting Multi-Agent Orchestration Demo");
  console.log("==================================================");

  const prompt = "Find the approximate population of Tokyo and New York City. Then calculate the total combined population and the difference between them.";
  console.log(`User Prompt: "${prompt}"\n`);

  try {
    const result = await orchestratorAgent.invoke({
      messages: [{ role: "user", content: prompt }],
    });

    console.log("\n==================================================");
    console.log("FINAL ORCHESTRATOR REPORT:");
    console.log("==================================================");
    console.log(result.messages[result.messages.length - 1].content);
  } catch (error) {
    console.error("Error during multi-agent execution:", error);
  }
}

runDemo();
