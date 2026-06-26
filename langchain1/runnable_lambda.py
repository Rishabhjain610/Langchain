from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnableSequence, RunnableLambda
model = ChatOllama(model="qwen3:8b", base_url="http://localhost:11434")
def word_counter(text: str) -> dict:
    return {"word_count": len(text.split())}
prompt=PromptTemplate(
    template="Give the text {text}",
    input_variables=["text"]
)
pasrer=StrOutputParser()

chain=RunnableSequence(
    prompt,
    model,
    pasrer,
    RunnableLambda(word_counter)
)

response=chain.invoke({"text": "hello world"})
print(response)