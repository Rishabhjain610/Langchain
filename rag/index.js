import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { ChatOllama } from "@langchain/ollama"
import { PDFParse } from "pdf-parse"
import fs from "fs"
import path from "path"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters"
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const model = new ChatOllama({
      model: "gemma4:31b-cloud", // Matches locally available model
      baseUrl: "http://127.0.0.1:11434", // Local Ollama server address
});
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text:latest", // Default value
  baseUrl: "http://localhost:11434", // Default value
});


const originalNodeVersion = process.versions.node;
// Delete node version temporarily to bypass undici agent injection in @qdrant/js-client-rest
delete process.versions.node;

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  apiKey: process.env.QUADRANT_KEY,
  collectionName: "langchainjs-testing",
});

// Restore node version
process.versions.node = originalNodeVersion;
const upload = async () => {
    const pdfPath = "./Rishabh_Profile_Summary.pdf";
    const buffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: buffer });
    try {
        const pdfresult = await parser.getText();
        console.log(pdfresult.text);
        const text = pdfresult.text;
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,
            chunkOverlap: 500
        });
        const chunks = await splitter.createDocuments([text]);
        await vectorStore.addDocuments(chunks);
        console.log("Documents added successfully");
    } finally {
        await parser.destroy();
    }
};





app.get("/generate", async (req, res) => {
    try {
        const query = "how much i scored in 10th and jee";
        if (!query) {
            return res.status(400).send({ error: "Query parameter 'query' is required." });
        }
        
        // 1. Retrieve context from Qdrant vector store
        const documents = await vectorStore.similaritySearch(query, 3);
        console.log(documents);
        const context = documents.map(doc => doc.pageContent).join("\n\n");
        
        // 2. Build the RAG prompt
        const prompt = `Use the following context to answer the question at the end. If you don't know the answer, say that you don't know. Do not make up answers.

Context:
${context}

Question: ${query}
Answer:`;

        // 3. Generate response with Ollama LLM
        const result = await model.invoke(prompt);
        res.send({
            answer: result.content,
            sources: documents.map(doc => ({
                pageContent: doc.pageContent.substring(0, 100) + "...",
                metadata: doc.metadata
            }))
        });
    } catch (error) {
        console.error("Error during model invocation:", error);
        res.status(500).send({
            error: "Failed to generate answer",
            details: error.message
        });
    }
});

app.listen(process.env.PORT || 8000, () => {
    console.log("Server is running on port", process.env.PORT || 8000);
});


