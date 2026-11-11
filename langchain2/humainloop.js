import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { createAgent } from "langchain";
import {
  Annotation,
  Command,
  END,
  START,
  StateGraph,
  interrupt,
} from "@langchain/langgraph";
import { z } from "zod/v4";

// 1. Human decision ka Zod schema
const Decision = z.object({
  approved: z.boolean(),
  note: z.string().default(""),
});

// 2. LangGraph State define kar rahe hain
const State = Annotation.Root({
  prompt: Annotation(),
  draft: Annotation(),
  decision: Annotation(),
  finalStatus: Annotation(),
});
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect(); // MongoDB se connect ho jao
const checkpointer = new MongoDBSaver({ client ,dbName:"langchain",collectionName:"shortterm" }); // MongoDBSaver ka instance banao

// 3. createAgent se LLM agent banaya (yeh email draft likhega)
const draftAgent = createAgent({
  model: "groq:openai/gpt-oss-20b",
  tools: [],
  systemPrompt: "You write concise, polite 2-line email drafts. Output only the email text.",
});

// 4. LangGraph workflow: draftNode -> humanReview -> (approved ? sendNode : cancelNode)
const graph = new StateGraph(State)
  .addNode("draftNode", async (state) => {
    const res = await draftAgent.invoke({
      messages: [{ role: "user", content: state.prompt }],
    });
    const draftText = res.messages[res.messages.length - 1].content;
    return { draft: draftText };
  })
  .addNode("humanReview", (state) => {
    // LangGraph interrupt() yahan graph rok dega aur human approval mangega
    const decision = interrupt(
      {
        question: "Kya yeh email draft approve karke bhej dein?",
        draft: state.draft,
      },
      { responseSchema: Decision }
    );
    return { decision };
  })
  .addNode("sendNode", (state) => {
    console.log(`[Email Sent] Note: "${state.decision.note}"\n${state.draft}`);
    return { finalStatus: "Email sent after human approval!" };
  })
  .addNode("cancelNode", (state) => {
    return { finalStatus: `Cancelled by human: ${state.decision?.note || "No reason"}` };
  })
  .addEdge(START, "draftNode")
  .addEdge("draftNode", "humanReview")
  .addConditionalEdges("humanReview", (state) => {
    return state.decision?.approved ? "sendNode" : "cancelNode";
  })
  .addEdge("sendNode", END)
  .addEdge("cancelNode", END)
  .compile({ checkpointer: checkpointer });

const config = { configurable: { thread_id: "langgraph-hitl-1" } };

// Step 1: Graph chalao — draftNode LLM se draft banayega, phir humanReview pe ruk jayega
const result = await graph.invoke(
  { prompt: "Write an email to Rohit saying the 5pm meeting is confirmed." },
  config
);
console.log(result);
console.log("Paused at Interrupt:", JSON.stringify(result.__interrupt__?.[0].value, null, 2));

// Step 2: Human approval dekar LangGraph ko wahin se resume karo
const resumed = await graph.invoke(
  new Command({ resume: { approved: true, note: "Looks good, bhej do!" } }),
  config
);
console.log("Final Status:", resumed.finalStatus);
