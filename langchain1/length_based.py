import sys
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Ensure console prints unicode characters correctly on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter

# 1. Load the PDF document
print("Loading PDF document...")
loader = PyPDFLoader("Rishabh Jain (3).pdf")
documents = loader.load()
print(f"Successfully loaded {len(documents)} page(s).\n")

# 2. Initialize text splitters
print("Initializing CharacterTextSplitter...")
char_splitter = CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separator="\n"
)

print("Initializing RecursiveCharacterTextSplitter...")
recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100
)

# 3. Split the documents
print("\nSplitting documents using CharacterTextSplitter...")
char_chunks = char_splitter.split_documents(documents)
print(f"Created {len(char_chunks)} chunks.")

print("\nSplitting documents using RecursiveCharacterTextSplitter...")
recursive_chunks = recursive_splitter.split_documents(documents)
print(f"Created {len(recursive_chunks)} chunks.")

# 4. Display comparison of first few chunks
print("\n=== CharacterTextSplitter Sample Chunk ===")
if char_chunks:
    print(f"Chunk 1 (Length: {len(char_chunks[0].page_content)})")
    print(char_chunks[0].page_content)
    print("=" * 40)

print("\n=== RecursiveCharacterTextSplitter Sample Chunk ===")
if recursive_chunks:
    print(f"Chunk 1 (Length: {len(recursive_chunks[0].page_content)})")
    print(recursive_chunks[0].page_content)
    print("=" * 40)
