import re
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnableSequence, RunnableLambda

# Initialize LLM
# Using a single model avoids needing a second Ollama model running simultaneously.
# If you have llama3.1:8b pulled, you can set model1 = ChatOllama(model="llama3.1:8b", ...)
model = ChatOllama(model="qwen3:8b", base_url="http://localhost:11434")

# Setup prompts
prompt1 = PromptTemplate.from_template("Who is the president of {country}? Reply with only the name.")
prompt2 = PromptTemplate.from_template(
    "Tell me about '{president}': their full name and profession. Be concise."
)

parser = StrOutputParser()


def strip_think_tags(text: str) -> str:
    """qwen3 wraps its reasoning in <think>...</think> — strip them for clean output."""
    clean = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    return clean


def to_president_dict(text: str) -> dict:
    """Convert plain president name string into a dict for prompt2."""
    clean = strip_think_tags(text)
    # Use the first non-empty line as the name
    name = next((line.strip() for line in clean.splitlines() if line.strip()), clean)
    return {"president": name}


# RunnableParallel: both branches receive the same input {"country": "india"}
# Branch 1 - 'president': calls the LLM to get the president's name
# Branch 2 - 'info': chains prompt2 to ask for more info about the president
parallel_chain = RunnableParallel({
    "president": RunnableSequence(
        prompt1,
        model,
        parser,
        RunnableLambda(strip_think_tags),  # strip qwen3 think tags
    ),
    "info": RunnableSequence(
        prompt1,
        model,
        parser,
        RunnableLambda(to_president_dict),  # extract name -> dict
        prompt2,
        model,
        parser,
        RunnableLambda(strip_think_tags),
    ),
})

response = parallel_chain.invoke({"country": "india"})
print("President:", response["president"])
print("\nInfo:", response["info"])

parallel_chain.get_graph().print_ascii()
