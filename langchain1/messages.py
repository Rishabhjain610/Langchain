from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="gemma4:31b-cloud",
    base_url="http://127.0.0.1:11434",
)

messages = [
    SystemMessage(content="You are a helpful assistant"),
    HumanMessage(content="hi which is greater 2 or 0"),
    AIMessage(content="2 is greater than 0."),
    HumanMessage(content="mutiply greater by 2 and lesser subtract 6 whats the answer"),
]

response = llm.invoke(messages)
messages.append(response)
print(messages)
print(response.content) 