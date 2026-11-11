import sys
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Ensure console prints unicode characters correctly on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from langchain_community.retrievers import WikipediaRetriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def main():
    # 1. Initialize the Wikipedia Retriever
    # top_k_results: maximum number of documents to retrieve
    # doc_content_chars_max: maximum character length of the retrieved content per document
    print("Initializing Wikipedia Retriever...")
    retriever = WikipediaRetriever(
        top_k_results=2, 
        doc_content_chars_max=4000
    )

    # 2. Run a query directly on the retriever to fetch pages
    query = "togepi vs china"
    print(f"\n--- Retrieving documents for query: '{query}' ---")
    
    try:
        docs = retriever.invoke(query)
        print(f"Successfully retrieved {len(docs)} document(s).\n")
        
        for i, doc in enumerate(docs):
            title = doc.metadata.get("title", "Unknown")
            source = doc.metadata.get("source", "No source link")
            summary = doc.metadata.get("summary", "No summary available")
            
            print(f"[{i + 1}] Document Title: {title}")
            print(f"    Source Link: {source}")
            print(f"    Summary Snippet: {summary[:300]}...")
            print(f"    Content Length: {len(doc.page_content)} characters")
            print("-" * 60)
            
    except Exception as e:
        print(f"Error during retrieval: {e}")
        return

    # 3. Setting up a RAG (Retrieval-Augmented Generation) Chain
    # We will combine retrieved context with a question to generate an answer.
    print("\n--- Setting up a RAG Chain with ChatOllama and Wikipedia ---")
    
    # Define a prompt template for the RAG chain
    prompt = ChatPromptTemplate.from_template("""
Answer the question based only on the provided context. If you don't know the answer or the context doesn't mention it, say that you don't know.

Context:
{context}

Question: {question}

Answer:""")

    # Try to initialize the ChatOllama model (matching the client's setup)
    print("Connecting to local Ollama (gemma4:31b-cloud)...")
    llm = ChatOllama(
        model="gemma4:31b-cloud",  # Match the model name from chatbot.py
        base_url="http://127.0.0.1:11434",
        temperature=0
    )

    # Helper function to format retrieved documents as context string
    def format_docs(docs):
        return "\n\n".join([f"Document: {d.metadata.get('title')}\nContent: {d.page_content}" for d in docs])

    # Construct the RAG chain using LCEL (LangChain Expression Language)
    # 1. Retrieve documents using the query (which is also the question)
    # 2. Format the documents into a string
    # 3. Format prompt
    # 4. Call LLM
    # 5. Parse response as string
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    # Ask a specific question about the topic
    question = "What is Generative artificial intelligence?"
    print(f"\nAsking RAG chain: '{question}'")
    
    try:
        response = rag_chain.invoke(question)
        print("\n--- RAG Chain Response ---")
        print(response)
    except Exception as e:
        print(f"\n[Warning] Could not execute the RAG chain. (Error: {e})")
        print("To run the RAG part, make sure Ollama is running locally with the model 'gemma4:31b-cloud'.")
        print("\nYou can still use the retriever output directly from step 2!")

if __name__ == "__main__":
    main()
