from langchain_ollama import ChatOllama
from langchain.agents import create_agent
# Connect to Ollama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
llm = ChatOllama(
    model="gemma4:31b-cloud",
    base_url="http://127.0.0.1:11434",
)
# agent=create_agent(
#     model=llm,
#     system_prompt="You are maths agent solve maths problems"
# )
chathistory=[
    SystemMessage(content="You are maths agent solve maths problems")
]
while True:
    user_input=input('You:')
    if  (user_input.lower()=='exit'):
        print(chathistory)
        break
    chathistory.append(HumanMessage(content=user_input))
    response = llm.invoke(chathistory)
    chathistory.append(AIMessage(content=response.content))
    print(  'Assistant:', response.content)   