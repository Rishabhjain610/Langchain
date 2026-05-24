from langchain_ollama import OllamaEmbeddings
emebeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434",
)
documents=[]