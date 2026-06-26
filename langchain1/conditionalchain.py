# langchain_ollama se ChatOllama import kar rahe hain local/cloud models run karne ke liye
from langchain_ollama import ChatOllama
# dotenv module se load_dotenv import kar rahe hain env variables load karne ke liye
from dotenv import load_dotenv
# Prompts construct karne ke liye PromptTemplate import kar rahe hain
from langchain_core.prompts import PromptTemplate
# LLM output ko string format mein read karne ke liye StrOutputParser import kar rahe hain
from langchain_core.output_parsers import StrOutputParser
# LCEL (LangChain Expression Language) routing aur branching ke liye elements import kar rahe hain
from langchain_core.runnables import RunnableParallel, RunnableBranch, RunnableLambda
# JSON structure ke strict validation ke liye PydanticOutputParser import kar rahe hain
from langchain_core.output_parsers import PydanticOutputParser
# Pydantic validation schema aur descriptions generate karne ke liye models import kar rahe hain
from pydantic import BaseModel, Field
# Values ko limited options ('positive' ya 'negative') mein restrict karne ke liye Literal use kar rahe hain
from typing import Literal
# System level changes ke liye sys module import kar rahe hain
import sys

# Windows command prompt par emojis aur non-ASCII characters bina crash hue print karne ke liye encoding set kar rahe hain
sys.stdout.reconfigure(encoding='utf-8')

# .env file mein defined env variables ko program memory mein load kar rahe hain

# Gemma-4 cloud model connect kar rahe hain jo remote registry se local host ke bypass serve ho raha hai
model = ChatOllama(model="gemma4:31b-cloud", base_url="http://localhost:11434")

# Standard string output parsing mechanism initialize kar rahe hain
parser = StrOutputParser()

# Ek Pydantic class define kar rahe hain jismein output JSON ka sentiment key strict parameter check karega
class Feedback(BaseModel):
    sentiment: Literal['positive', 'negative'] = Field(description='Give the sentiment of the feedback')

# Pydantic schema validation parser register kar rahe hain jo LLM response ko validation class ke structural object mein convert karega
parser2 = PydanticOutputParser(pydantic_object=Feedback)

# Classification prompt template jismein input variables aur auto-generated formatting instructions link honge
prompt1 = PromptTemplate(
    template='Classify the sentiment of the following feedback text into postive or negative \n {feedback} \n {format_instruction}',
    input_variables=['feedback'],
    partial_variables={'format_instruction':parser2.get_format_instructions()}
)

# Classifier chain define kar rahe hain: Prompt construct hoga -> Model invoke hoga -> Parser2 structure validate karega
classifier_chain = prompt1 | model | parser2

# Positive feedback receive hone par customer response likhne ka prompt
prompt2 = PromptTemplate(
    template='Write an appropriate response to this positive feedback \n {feedback}',
    input_variables=['feedback']
)

# Negative feedback receive hone par customer response aur apology email generate karne ka prompt
prompt3 = PromptTemplate(
    template='Write an appropriate response to this negative feedback \n {feedback}',
    input_variables=['feedback']
)

# Branch chain define kar rahe hain jo logic check karega:
# 1. Agar input structure ka sentiment 'positive' hai to positive respond chain chalao
# 2. Agar sentiment 'negative' hai to negative respond chain chalao
# 3. Agar sentiment fail hota hai ya alag aata hai to fallback lambda function return karo
branch_chain = RunnableBranch(
    (lambda x:x.sentiment == 'positive', prompt2 | model | parser),
    (lambda x:x.sentiment == 'negative', prompt3 | model | parser),
    RunnableLambda(lambda x: "could not find sentiment")
)

# Poori unified chain ready kar rahe hain: Pehle text classify hoga, fir route hokar outcome generate hoga
chain = classifier_chain | branch_chain

# Test run kar rahe hain jismein classification ke liye 'feedback' pass kiya gaya hai aur response print hoga
print(chain.invoke({'feedback': 'This is a beautiful phone'}))

# Output processing pipeline ka layout ASCII format mein console par print karenge
chain.get_graph().print_ascii()

