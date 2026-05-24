# # 
# from langchain.agents import create_agent

# def get_weather(city: str) -> str:
#     """Get weather for a given city."""
#     return f"It's always sunny in {city}!"

# agent = create_agent(
#     model="ollama:gemma4:31b-cloud",
#     # tools=[get_weather],
#     # system_prompt="You are a helpful assistant",
# )

# # result = agent.invoke(
# #     {"messages": [{"role": "user", "content": "What's the weather in San Francisco?"}]}
# # )
# result=agent.invoke("What's the weather in San Francisco?")
# print(result)
# from langchain.chat_models import Ollama

# # Create an Ollama instance pointing to the local server
# llm = Ollama(
#     model="gemma4:31b-cloud",  # Replace with the model name you want to use
#     base_url="http://localhost:11434",  # Default port for Ollama
# )

# # Invoke the model with a plaintext query
# response = llm.invoke("What's the weather in San Francisco?")

# # Print the response
# print(response)
# pip install -qU langchain langchain-ollama
from langchain.agents import create_agent

def get_weather(city: str) -> str:
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="ollama:gemma4:31b-cloud",
    system_prompt="You are a helpful assistant",
)

result = agent.invoke(
    {
        "messages": [
            {"role": "user", "content": "Kello hi"}
        ]
    }
)

print(result["messages"][-1].content)
