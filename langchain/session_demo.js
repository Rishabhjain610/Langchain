import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

// 1. Initialize the local Ollama LLM
const llm = new ChatOllama({
  model: "llama3.1:8b", // or another model available on your system
  baseUrl: "http://127.0.0.1:11434",
});

// 2. Define a prompt that includes a placeholder for the chat history
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful AI assistant. Always remember the user's details from the chat history."],
  new MessagesPlaceholder("chat_history"), // Holds the session message list
  ["human", "{input}"],                     // Current user input
]);

// 3. Connect the prompt and LLM into a chain
const chain = prompt.pipe(llm);

// 4. In-memory dictionary to store session history for multiple users/sessions
const sessionStore = {};

// 5. Wrap the chain with RunnableWithMessageHistory
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  // Factory function to return the correct history object for a given sessionId
  getMessageHistory: async (sessionId) => {
    if (!sessionStore[sessionId]) {
      sessionStore[sessionId] = new InMemoryChatMessageHistory();
    }
    return sessionStore[sessionId];
  },
  inputMessagesKey: "input",          // Matches the placeholder key in prompt
  historyMessagesKey: "chat_history", // Matches the MessagesPlaceholder key
});

// 6. Test interaction for Session A
console.log("--- Starting Session A ---");
const sessionAConfig = { configurable: { sessionId: "session-abc-123" } };

console.log("\nUser: Hi! My name is Rishabh.");
let responseA1 = await chainWithHistory.invoke(
  { input: "Hi! My name is Rishabh." },
  sessionAConfig
);
console.log("AI:", responseA1.content);

console.log("\nUser: What is my name?");
let responseA2 = await chainWithHistory.invoke(
  { input: "What is my name?" },
  sessionAConfig
);
console.log("AI:", responseA2.content);

// 7. Test interaction for Session B (demonstrating session isolation)
console.log("\n--- Starting Session B (Isolated Session) ---");
const sessionBConfig = { configurable: { sessionId: "session-xyz-789" } };

console.log("\nUser: What is my name?");
let responseB1 = await chainWithHistory.invoke(
  { input: "What is my name?" },
  sessionBConfig
);
console.log("AI (Session B):", responseB1.content); // Should not know Rishabh
