from transformers import logging as transformers_logging
import logging
import warnings

# Silence verbose transformers package import warnings
transformers_logging.set_verbosity_error()
logging.getLogger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
import streamlit as st
result=create_agent(
    model="ollama:gemma4:31b-cloud",
    system_prompt="You are a helpful assistant",
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
  # Build a structured prompt combining the dropdown options and user query
  combined_prompt = (
    f"Paper type: {paper_type}\n"
    f"Explanation style: {explanation_style}\n"
    f"Explanation length: {explanation_length}\n\n"
    f"User question:\n{query}"
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
    f"**Paper type:** {paper_type}  \\\  \n**Explanation style:** {explanation_style}  \\\  \n**Length:** {explanation_length}"
  )
  