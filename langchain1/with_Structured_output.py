from typing import Optional, TypedDict, Annotated
from langchain_ollama import ChatOllama
import json

# Movie ka data structure define kar rahe hain, jisme movie ki details aayengi.
# TypedDict ye ensure karta hai ki dictionary mein ye specific keys honi chahiye.
class Movie(TypedDict):
    title: str       # Movie ka naam (string)
    rating: int      # Movie ki rating (integer)
    year: int        # Movie ka release year (integer)
    
    # Annotated ka use karke hum extra description de rahe hain LLM ko samjhane ke liye
    summary: Annotated[str, "summary of the movie"]
    
    # Optional[list[str]] ka matlab hai ki ye field ek list of strings ho sakti hai, ya phir None (kuch nahi)
    pros: Annotated[Optional[list[str]], "list of pros"]
    cons: Annotated[Optional[list[str]], "list of cons"]

# MovieList ek wrapper structure hai jisme 'movies' key ke andar multiple 'Movie' aayenge.
# Ye isliye banaya taaki LLM multiple movies ki ek list return kar sake.
class MovieList(TypedDict):
    movies: list[Movie]

# Ollama model ko setup aur initialize kar rahe hain
llm = ChatOllama(
    model='qwen2.5-coder:7b',         # Model ka naam
    base_url='http://127.0.0.1:11434' # Local Ollama server ka address
)

# .with_structured_output() LLM ko force karta hai ki wo output ko MovieList schema format mein hi de.
structured_llm = llm.with_structured_output(MovieList)

print("Requesting top 5 movies...")

# Ab qwen2.5-coder model use kar rahe hain, isliye humein manually JSON keys nahi batane padenge!
# .with_structured_output() apna kaam backend se khud karega.
# Direct sawal pucho, aur LLM khud TypedDict ko samajh kar output dega.
response = structured_llm.invoke("give me top 5 movies with all the details which i demanded")

# json.dumps() kya kar raha hai?
# 1. 'response' ek Python dictionary hai, jo output aayi hai.
# 2. json.dumps() is dictionary ko wapas ek JSON formatted string mein convert karta hai.
# 3. 'indent=2' ka use karne se output nicely format (pretty-print) ho jata hai. Yani keys aur values proper spacing aur naye lines ke saath dikhte hain, taaki hum easily padh sakein.
print(json.dumps(response, indent=2))