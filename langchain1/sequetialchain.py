from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Initialize LLM
model = ChatOllama(model="qwen3:8b", base_url="http://localhost:11434")
model1 = ChatOllama(model="llama3.1:8b", base_url="http://localhost:11434")

# Setup two prompts and two parsers
prompt1 = PromptTemplate.from_template("who is president of {country}")
prompt2 = PromptTemplate.from_template(
    "Given the name '{president}', tell me about their full name and their profession."
)

parser1 = StrOutputParser()
parser2 = StrOutputParser()

# Chain prompt1 -> model -> parser1 -> transform to dict for prompt2 -> model1 -> parser2
chain = (
    prompt1
    | model
    | parser1
    | (lambda president_name: {"president": president_name.strip()})
    | prompt2
    | model1
    | parser2
)

response = chain.invoke({"country": "india"})
print(response)

chain.get_graph().print_ascii()
