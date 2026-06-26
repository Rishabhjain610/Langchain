import json
import requests
from typing import Any, Dict, List, Union, Callable

class CustomPromptTemplate:
    """
    A custom Prompt Template that takes a template string and input variables,
    and formats them to construct a prompt.
    """
    def __init__(self, template: str, input_variables: List[str]):
        self.template = template
        self.input_variables = input_variables

    def format(self, **kwargs) -> str:
        # Ensure all required input variables are passed
        for var in self.input_variables:
            if var not in kwargs:
                raise ValueError(f"Missing required variable: '{var}'")
        return self.template.format(**kwargs)

    def __or__(self, other: Any) -> "CustomChain":
        return CustomChain(self) | other


class CustomModel:
    """
    A custom Model interface that sends requests to Ollama's HTTP API.
    If Ollama is not running, it falls back to a mock/simulated response to prevent crashes.
    """
    def __init__(self, model_name: str = "llama3.1:8b", base_url: str = "http://127.0.0.1:11434"):
        self.model_name = model_name
        self.base_url = base_url

    def invoke(self, prompt: str) -> str:
        print(f"\n[CustomModel] Invoking LLM ({self.model_name})...")
        try:
            # We call the Ollama API '/api/generate' directly
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=8
            )
            if response.status_code == 200:
                result_text = response.json().get("response", "")
                return result_text
            else:
                raise Exception(f"HTTP Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[CustomModel Info] Connect to Ollama failed: {e}")
            print("[CustomModel Info] Falling back to Simulated LLM Response.")
            # Fallback mock response for testing/demonstration
            if "json" in prompt.lower():
                return (
                    "{\n"
                    '  "topic": "Simulated Topic",\n'
                    '  "key_points": ["Point 1", "Point 2", "Point 3"],\n'
                    '  "summary": "This is a fallback JSON output because Ollama is not reachable."\n'
                    "}"
                )
            return f"This is a simulated fallback response. Prompt received: '{prompt[:60]}...'"

    def __or__(self, other: Any) -> "CustomChain":
        return CustomChain(self) | other


class CustomOutputParser:
    """
    A custom Output Parser that processes the LLM output.
    Can return plain text, or parse markdown-wrapped/raw JSON strings.
    """
    def __init__(self, parse_type: str = "str"):
        self.parse_type = parse_type

    def parse(self, text: str) -> Any:
        print(f"[CustomOutputParser] Parsing output as {self.parse_type}...")
        if self.parse_type == "json":
            cleaned = text.strip()
            # Clean markdown code blocks if present
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
                # Try finding first '{' and last '}'
                try:
                    start_idx = cleaned.find('{')
                    end_idx = cleaned.rfind('}') + 1
                    if start_idx != -1 and end_idx != -1:
                        return json.loads(cleaned[start_idx:end_idx])
                except Exception:
                    pass
                return {"error": "Failed to parse JSON", "raw_output": text}
        return text

    def __or__(self, other: Any) -> "CustomChain":
        return CustomChain(self) | other


class CustomChain:
    """
    A pipeline/chain container that allows chaining components via the '|' operator
    and executing them sequentially (LCEL style).
    """
    def __init__(self, *steps: Any):
        self.steps: List[Any] = []
        for step in steps:
            if isinstance(step, CustomChain):
                self.steps.extend(step.steps)
            else:
                self.steps.append(step)

    def __or__(self, other: Any) -> "CustomChain":
        return CustomChain(*self.steps, other)

    def invoke(self, inputs: Union[str, Dict[str, Any]]) -> Any:
        current_value = inputs
        for i, step in enumerate(self.steps):
            if isinstance(step, CustomPromptTemplate):
                if isinstance(current_value, dict):
                    current_value = step.format(**current_value)
                else:
                    raise TypeError("CustomPromptTemplate expects a dictionary input.")
            elif isinstance(step, CustomModel):
                current_value = step.invoke(str(current_value))
            elif isinstance(step, CustomOutputParser):
                current_value = step.parse(str(current_value))
            elif callable(step):
                current_value = step(current_value)
            else:
                raise TypeError(f"Unsupported chain step at index {i}: {type(step)}")
        return current_value


# Demonstration of the custom Prompt, Model, Parser Chain
if __name__ == "__main__":
    print("=== Custom Prompt, Model, Parser Demonstration ===")
    
    # 1. Instantiate the prompt template
    prompt = CustomPromptTemplate(
        template="Provide a brief summary of the topic: {topic} in structured JSON format with keys: 'topic', 'key_points', and 'summary'.",
        input_variables=["topic"]
    )

    # 2. Instantiate the custom model (connecting to local Ollama)
    model = CustomModel(model_name="llama3.1:8b")

    # 3. Instantiate the parser to handle JSON
    parser = CustomOutputParser(parse_type="json")

    # 4. Chain them together using the custom | operator (like LangChain Expression Language)
    chain = prompt | model | parser

    # 5. Run the chain
    test_input = {"topic": "Artificial Intelligence"}
    print(f"Running chain with input: {test_input}")
    
    result = chain.invoke(test_input)
    
    print("\n=== Final Parsed Result ===")
    print("Type of result:", type(result))
    print(json.dumps(result, indent=2))
