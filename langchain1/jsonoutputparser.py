from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# 1. Initialize the JSON Output Parser
parser = JsonOutputParser()

# 2. Setup the Prompt Template with format instructions
prompt = PromptTemplate(
    template="Write a short poem about {topic}.\n{format_instructions}",
    input_variables=["topic"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 3. Initialize the agent using the existing create_agent structure
agent = create_agent(
    model="ollama:qwen3:8b",
    system_prompt="You are a helpful assistant",
)

# 4. Format the prompt
formatted_prompt = prompt.format(topic="cat")

# 5. Invoke the agent
print("Invoking agent...")
response = agent.invoke({"messages": [{"role": "user", "content": formatted_prompt}]})

# 6. Extract the raw text response
raw_text = response['messages'][-1].content
print("\nRaw Text Response:")
print(raw_text)

# 7. Parse the text using the output parser
parsed_json = parser.parse(raw_text)
print("\nParsed JSON:")
print(parsed_json)
