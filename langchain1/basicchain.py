from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# 1. Initialize the JSON Output Parser
parser = JsonOutputParser()

# 2. Setup the Prompt Template (injecting format_instructions)
prompt = PromptTemplate(
    template="Generate 5 interesting facts about {topic}.\n{format_instructions}", 
    input_variables=["topic"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 3. Initialize the agent (keeping your original structure)
agent = create_agent(
    model="ollama:qwen3:8b",
    system_prompt="You are a helpful assistant",
)

# 4. Format the prompt with the dynamic topic
formatted_prompt = prompt.format(topic="the Moon")

# 5. Invoke the agent
print("Invoking agent...")
response = agent.invoke({"messages": [{"role": "user", "content": formatted_prompt}]})

# 6. Extract the raw text from the agent's last message
raw_text = response['messages'][-1].content
print("\nRaw Text Response:")
print(raw_text)

# 7. Parse the raw text to JSON using the output parser
parsed_json = parser.parse(raw_text)
print("\nParsed JSON (Python Object):")
print(parsed_json)
print("Type:", type(parsed_json))
