// // LangGraph aur Zod se zaroori cheezein import kar rahe hain
import { StateGraph, StateSchema, ReducedValue, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod/v4";

// // State define kar rahe hain — graph ka dil yahi hai
// // 'foo' ek simple string hai, aur 'bar' ek array hai jo values ko accumulate karta rehta hai
// const State = new StateSchema({
//   foo: z.string(), // ek string value — seedha simple
//   bar: new ReducedValue(
//     z.array(z.string()).default(() => []), // default mein khaali array rakha hai
//     {
//       inputSchema: z.array(z.string()),
//       reducer: (x, y) => x.concat(y), // purani values ke saath nayi values jod do — merge karo bhai!
//     }
//   ),
// });

// // Workflow banate hain — do nodes hain: A aur B
// const workflow = new StateGraph(State)
//   .addNode("nodeA", (state) => {
//     // nodeA apna kaam karta hai — 'foo' ko "a" set karo aur bar mein "a" daal do
//     return { foo: "Rishabh jain", bar: ["a"] };
//   })
//   .addNode("nodeB", (state) => {
//     // nodeB bhi apna kaam karta hai — 'foo' ko "b" set karo aur bar mein "b" daal do
//     return { foo: "b", bar: ["b"] };
//   })
//   .addEdge(START, "nodeA")   // graph shuru hote hi pehle nodeA pe jaao
//   .addEdge("nodeA", "nodeB") // nodeA ke baad nodeB ka number aata hai
//   .addEdge("nodeB", END);    // nodeB ke baad kaam khatam — bye bye!

// // MemorySaver = short-term memory ka jugaad — conversation yaad rakhega
// const checkpointer = new MemorySaver();

// // Workflow ko compile karo aur checkpointer attach karo
// const graph = workflow.compile({ checkpointer });

// // Config mein thread_id diya hai taaki memory thread-wise track ho sake
// const config = { configurable: { thread_id: "1" } };

// // Graph ko invoke karo khaali initial state ke saath — ab chalega machine!
// const answer=await graph.invoke({ foo: "", bar: [] }, config);
// console.log("Final State:", answer); // final state print karo





//mongodb ke liye code yahan hai, agar aapko database mein save karna ho to
import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
const state=new StateSchema({
 name:z.string().default("Rishabh"),
});

const worflow=new StateGraph(state)
.addNode("savename",(state)=>{
    return {name:"Rishabh jain",state:state.name}
})
.addEdge(START,"savename")
.addEdge("savename",END);
// URL .env file se aa raha hai — hardcode mat karo bhai!
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect(); // MongoDB se connect ho jao
const checkpointer = new MongoDBSaver({ client ,dbName:"langchain",collectionName:"shortterm" }); // MongoDBSaver ka instance banao

const graph = worflow.compile({ checkpointer });

// 5. Invoke karo thread_id ke sath (isi thread_id se MongoDB mein memory bachegi)
const config = { configurable: { thread_id: "user_thread_1" } };
// Pehli baar naam bheja
const res1 = await graph.invoke({ name: "Rohit Jain" }, config);
console.log("Response 1:", res1);
// Agli baar bina naam bheje bhi MongoDB se purani state fetch kar lega:
const res2 = await graph.invoke({}, config);
console.log("Memory se yaad kiya hua naam:", res2.name);