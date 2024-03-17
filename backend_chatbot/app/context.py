import os

from llama_index import ServiceContext
from llama_index.llms import OpenAI
import openai
from langchain.embeddings import HuggingFaceEmbeddings

openai.api_key = ""
def create_base_context():
    model = os.getenv("MODEL", "gpt-3.5-turbo")
    embed_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-roberta-large-v1"
)
    return ServiceContext.from_defaults(
        llm=OpenAI(model=model),embed_model=embed_model
    )
