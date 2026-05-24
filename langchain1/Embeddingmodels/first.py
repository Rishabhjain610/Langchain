from langchain_ollama import OllamaEmbeddings

# Create embeddings with Ollama
embeddings = OllamaEmbeddings(
    model="nomic-embed-text",  # embedding model
    base_url="http://localhost:11434",
)

# Embed a single query
text = "The capital of France is Paris"
embedding = embeddings.embed_query(text)
print(f"Embedding vector length: {len(embedding)}")
print(f"First 5 values: {embedding[:5]}")

# Embed multiple documents
docs = ["Paris is great", "London is the capital of England", "Berlin is the capital of Germany"]
embeddings_list = embeddings.embed_documents(docs)
print(f"\nEmbedded {len(embeddings_list)} documents")
print(f"Each embedding has {len(embeddings_list[0])} dimensions")
print(embeddings_list)