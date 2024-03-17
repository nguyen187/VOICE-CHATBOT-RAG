import logging
import os
from llama_index import (
    StorageContext,
    load_index_from_storage,
)
from llama_index.llms import  OpenAI

from app.engine.constants import STORAGE_DIR
from app.engine.context import create_service_context

from llama_index.graph_stores import Neo4jGraphStore

def get_chat_engine():
    service_context = create_service_context()
    # check if storage already exists
    # if not os.path.exists(STORAGE_DIR):
    #     raise Exception(
    #         "StorageContext is empty - call 'python app/engine/generate.py' to generate the storage first"
    #     )
    logger = logging.getLogger("uvicorn")
    # load the existing index
    logger.info(f"Loading index from {STORAGE_DIR}...")
    username = "neo4j"
    password = ""
    url = ""
    database = "neo4j"

    space_name = "rag_workshop"
    edge_types, rel_prop_names = ["relationship"], [
        "relationship"
    ]  # default, could be omit if create from an empty kg
    tags = ["entity"]  # default, could be omit if create from an empty kg

    graph_store = Neo4jGraphStore(
        username=username,
        password=password,
        url=url,
        database=database,
    )
    path_cur = os.getcwd()
    print(path_cur+'\graph_chatbot')
    storage_graph = StorageContext.from_defaults(persist_dir = path_cur+'\graph_chatbot',graph_store = graph_store)
    llm = OpenAI(
        temperature=0,
        model="gpt-3.5-turbo",
        engine="td2"
    )

    # index = load_index_from_storage(storage_context, service_context=service_context)
    kg_index = load_index_from_storage(
    storage_context = storage_graph,
    service_context = service_context,
    max_triplets_per_chunk = 10,
    llm = llm
)
    logger.info(f"Finished loading index from {STORAGE_DIR}")
    return kg_index.as_chat_engine()
