import os
from azure.data.tables import TableServiceClient
from azure.storage.queue import QueueClient

def get_connection_string():
    conn = os.getenv("AzureWebJobsStorage")
    if not conn:
        raise RuntimeError("AzureWebJobsStorage not set")
    return conn

def get_table_client(table_name: str):
    conn = get_connection_string()
    service = TableServiceClient.from_connection_string(conn)
    return service.get_table_client(table_name=table_name)

def get_queue_client(queue_name: str):
    conn = get_connection_string()
    return QueueClient.from_connection_string(conn, queue_name)
