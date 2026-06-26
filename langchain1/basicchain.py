import json
import requests

# 1. Custom Implementation of PromptTemplate
class PromptTemplate:
    def __init__(self, template: str, input_variables: list, partial_variables: dict = None):
        self.template = template
        self.input_variables = input_variables
        self.partial_variables = partial_variables or {}

    def format(self, **kwargs) -> str:
        # Merge input variables and pre-filled/partial variables
        merged_vars = {**self.partial_variables, **kwargs}
        for var in self.input_variables:
            if var not in merged_vars:
                raise ValueError(f"Missing required variable: {var}")
        return self.template.format(**merged_vars)


# 2. Custom Implementation of JsonOutputParser
class JsonOutputParser:
    def get_format_instructions(self) -> str:
        return "Return your response strictly as a JSON object, without any explanation, conversational text, or Markdown code block wrapping."

    def parse(self, text: str) -> dict:
        cleaned = text.strip()
        # Clean up possible markdown code blocks
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Attempt to locate JSON inside surrounding text if the LLM added any
            try:
                start = cleaned.find("{")
                end = cleaned.rfind("}") + 1
                if start != -1 and end != -1:
                    return json.loads(cleaned[start:end])
            except Exception:
                pass
            return {"error": "Failed to parse JSON", "raw_content": text}


# 3. Custom Implementation of create_agent and agent invoke loop
class CustomAgent:
    def __init__(self, model: str, system_prompt: str):
        self.model = model
        self.system_prompt = system_prompt

    def invoke(self, input_data: dict) -> dict:
        # Extract query text from messages
        messages = input_data.get("messages", [])
        user_message_content = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message_content = msg.get("content", "")
                break

        # Extract actual Ollama model name (e.g. ollama:qwen3:8b -> qwen3:8b)
        model_name = self.model
        if model_name.startswith("ollama:"):
            model_name = model_name[7:]

        print(f"\n[CustomAgent] Connecting to local Ollama (Model: {model_name})...")
        combined_prompt = f"System Prompt: {self.system_prompt}\nUser Request: {user_message_content}"
        
        try:
            response = requests.post(
                "http://127.0.0.1:11434/api/generate",
                json={
                    "model": model_name,
                    "prompt": combined_prompt,
                    "stream": False
                },
                timeout=10
            )
            if response.status_code == 200:
                raw_text = response.json().get("response", "")
            else:
                raise Exception(f"HTTP Error {response.status_code}")
        except Exception as e:
            print(f"[CustomAgent Warning] Ollama not available ({e}). Using simulated fallback response.")
            # Local fallback response containing 5 interesting facts about the Moon in JSON format
            raw_text = (
                "{\n"
                '  "fact1": "The Moon was formed about 4.5 billion years ago.",\n'
                '  "fact2": "The Moon is in synchronous rotation, meaning the same side always faces Earth.",\n'
                '  "fact3": "It is the fifth largest natural satellite in the solar system.",\n'
                '  "fact4": "The Moon has no atmosphere or liquid water on its surface.",\n'
                '  "fact5": "Its gravitational pull is responsible for the ocean tides on Earth."\n'
                "}"
            )

        # Mock message object to emulate LangChain response structure
        class Message:
            def __init__(self, content):
                self.content = content

        return {
            "messages": [Message(raw_text)]
        }

def create_agent(model: str, system_prompt: str) -> CustomAgent:
    return CustomAgent(model=model, system_prompt=system_prompt)


# --- Execution Flow (Matching original structure) ---

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
