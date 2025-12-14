import logging
import json
import azure.functions as func

from ..storage_helpers import get_table_client

MEALS_TABLE = "Meals"

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("HTTPGetMealsByArea called.")

    area = req.params.get("area")
    if not area:
        return _error("Query parameter 'area' is required")

    try:
        table = get_table_client(MEALS_TABLE)
        entities = list(table.query_entities(f"PartitionKey eq '{area}'"))
    except Exception:
        logging.exception("Error querying Meals table")
        return _error("Failed to fetch meals")

    meals = []
    for e in entities:

        meal_name = e.get("name")
        restaurant = e.get("restaurantName")
        description = e.get("description")
        prep_minutes = e.get("prepMinutes") 
        price = e.get("price")

        meals.append({
            "id": e["RowKey"],            
            "mealId": e["RowKey"],        
            "name": meal_name,
            "restaurantName": restaurant,
            "description": description,
            "prepMinutes": prep_minutes,  
            "price": price,
            "imageUrl": e.get("imageUrl", "")
        })

    return func.HttpResponse(
        json.dumps(meals),
        mimetype="application/json"
    )

def _error(msg):
    return func.HttpResponse(
        json.dumps({"status": "error", "message": msg}),
        status_code=400,
        mimetype="application/json"
    )
