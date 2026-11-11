import sys
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Ensure console prints unicode characters correctly on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from langchain_community.document_loaders import PyPDFLoader
from langchain_experimental.text_splitter import SemanticChunker

# Select your choice of embeddings:
# Option A: Ollama Embeddings (nomic-embed-text:v1.5)
from langchain_ollama import OllamaEmbeddings
print("Loading OllamaEmbeddings (nomic-embed-text:v1.5)...")
embeddings = OllamaEmbeddings(
    model="nomic-embed-text:v1.5",
    base_url="http://localhost:11434"
)

# Option B: Hugging Face Embeddings (uncomment if you want to run completely locally in Python without Ollama)
# from langchain_huggingface import HuggingFaceEmbeddings
# print("Loading HuggingFaceEmbeddings (all-MiniLM-L6-v2)...")
# embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 1. Load the PDF document
print("Loading PDF document...")
loader = PyPDFLoader("Rishabh Jain (3).pdf")
documents = loader.load()
print(f"Successfully loaded {len(documents)} page(s).\n")

# 2. Initialize Semantic Chunker
print("Initializing SemanticChunker with percentile breakpoint threshold...")
text_splitter = SemanticChunker(
    embeddings,
    breakpoint_threshold_type="percentile"  # Options: "percentile", "standard_deviation", "interquartile"
)

# 3. Split the documents
print("Splitting documents semantically...")
chunks = text_splitter.split_documents(documents)
print(f"Created {len(chunks)} chunks.\n")

# 4. Display the first few chunks
for i, chunk in enumerate(chunks[:3]):
    print(f"--- Semantic Chunk {i+1} (Length: {len(chunk.page_content)}) ---")
    print(chunk.page_content)
    print("-" * 50)
