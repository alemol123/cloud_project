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
    except:
        return _error("Failed to fetch meals")

    meals = []
    for e in entities:
        meals.append({
            "mealId": e["RowKey"],
            "restaurantName": e.get("RestaurantName"),
            "dishName": e.get("DishName"),
            "description": e.get("Description"),
            "prepTimeMinutes": e.get("PrepTimeMinutes"),
            "price": e.get("Price"),
            "imageUrl": e.get("ImageUrl", "")
        })

    return func.HttpResponse(
        json.dumps({"status": "ok", "meals": meals}),
        mimetype="application/json"
    )

def _error(msg):
    return func.HttpResponse(
        json.dumps({"status": "error", "message": msg}),
        status_code=400,
        mimetype="application/json"
    )
