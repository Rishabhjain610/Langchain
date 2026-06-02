from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
from langchain_ollama import ChatOllama
import streamlit as st
import requests

# Check if Ollama is running
def check_ollama_running():
    try:
        requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        return True
    except:
        return False

# Connect to Ollama on port 11434
llm = ChatOllama(
    model="gemma4:31b-cloud",
    base_url="http://127.0.0.1:11434",
)

result=create_agent(
    model=llm,
    system_prompt="You are a helpful assistant",
)
# Prompt template for building the model input
prompt_template = PromptTemplate(
  template=(
    "Paper type: {paper_type}\n"
    "Explanation style: {explanation_style}\n"
    "Explanation length: {explanation_length}\n\n"
    "User question:\n{query}\n"
    "Add hi in last so i should understand that you are responding to a question and not just giving a general explanation. Hi!"
  ),
  input_variables=["paper_type", "explanation_style", "explanation_length", "query"],
)
st.header("Langchain Agent with Ollama")
# Dropdowns for research paper type, explanation style, and explanation length
paper_type = st.selectbox(
  "Research paper type",
  ["Survey", "Empirical", "Theoretical", "Case Study", "Method/Algorithm", "Other"],
)

explanation_style = st.selectbox(
  "Type of explanation",
  ["Technical", "High-level", "Intuitive", "Step-by-step"],
)

explanation_length = st.selectbox(
  "Length of explanation",
  ["Short", "Medium", "Long"],
)

# User input (appears after dropdowns)
query = st.text_input("Enter your query here")

if st.button("Submit"):
  if not check_ollama_running():
    st.error("❌ Ollama is not running! Please start Ollama with 'ollama serve' in a new terminal on port 11434")
  else:
    # Build a structured prompt using the PromptTemplate
    combined_prompt = prompt_template.format(
        paper_type=paper_type,
        explanation_style=explanation_style,
        explanation_length=explanation_length,
        query=query,
    )

    st.text("Processing...")
    response = result.invoke({"messages": [{"role": "user", "content": combined_prompt}]})
    # Display the assistant's last message
    try:
      assistant_msg = response["messages"][-1].content
    except Exception:
      assistant_msg = str(response)

  st.markdown("**Response:**")
  st.write(assistant_msg)
  # Echo the selected options for reference
  st.markdown(
    f"**Paper type:** {paper_type}  \\\\  \n**Explanation style:** {explanation_style}  \\\\  \n**Length:** {explanation_length}"
  )
  