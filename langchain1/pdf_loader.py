from langchain_community.document_loaders import PyPDFLoader
loader=PyPDFLoader("Rishabh Jain (3).pdf")
text=loader.load()
print(text)