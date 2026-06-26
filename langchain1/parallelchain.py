from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel

# Initialize LLM
model = ChatOllama(model="gemma4:31b-cloud", base_url="http://localhost:11434")
model1 = ChatOllama(model="gpt-oss:120b-cloud", base_url="http://localhost:11434")
prompt1 = PromptTemplate(
    template="generate short and simple notes from the following text \n {text}",
    input_variables=["text"],
)
prompt2 = PromptTemplate(
    template="Given the name '{president}', tell me about their full name and their profession.",
    input_variables=["president"],
)
prompt3 = PromptTemplate(
    template="merge the provided notes and quiz into a single document {notes} {quiz}",
    input_variables=["notes", "quiz"],
)
parser1 = StrOutputParser()
parallel_chain = RunnableParallel(
    {"notes": prompt1 | model1 | parser1, "quiz": prompt2 | model1 | parser1}
)
chain = parallel_chain | prompt3 | model | parser1

response = chain.invoke(
    {"text": "What is the capital of France?", "president": "Emmanuel Macron"}
)
print(response)

chain.get_graph().print_ascii()
