from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.schema.runnable import RunnableSequence
# Initialize LLM
model = ChatOllama(model="qwen3:8b", base_url="http://localhost:11434")
model1 = ChatOllama(model="llama3.1:8b", base_url="http://localhost:11434")

prompt=PromptTemplate(
    template="Write a joke about the topic {topic}",
    input_variables=["topic"]
)
prompt1=PromptTemplate(
    template="Explain the joke in depth {joke}",
    input_variables=["joke"]
)
pasrsers=StrOutputParser()

chain=RunnableSequence(prompt|model|pasrsers|prompt1|model1|pasrsers)

response = chain.invoke({"topic": "cats"})
print(response)
chain.get_graph().print_ascii()