from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama

# Connect to Ollama
llm = ChatOllama(
    model="gemma4:31b-cloud",
    base_url="http://127.0.0.1:11434",
)

# 1. Create a ChatPromptTemplate
# The recommended and cleanest way to template messages in LangChain is using `from_messages` 
# with tuples ("role", "template_string"). 
# Note: Using standard `SystemMessage` or `HumanMessage` classes directly won't replace `{variables}`.
chat_template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant. Your name is {name}."),
    ("human", "{user_input}")
])

# 2. Format the messages by invoking the template with your variables
prompt = chat_template.invoke({'name': 'Raj', 'user_input': 'What is the best domain to learn this month'})

print("--- Formatted Prompt ---")
print(prompt.to_messages()) # Shows the actual list of messages it generated

print("\n--- Invoking LLM ---")
# 3. Pass the prompt directly to the LLM to get a response
response = llm.invoke(prompt)
print("\nAssistant Response:")
print(response.content)