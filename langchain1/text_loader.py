import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from langchain_community.document_loaders import TextLoader
loader=TextLoader("resume.txt",autodetect_encoding=True)
docs=loader.load()
print(docs)