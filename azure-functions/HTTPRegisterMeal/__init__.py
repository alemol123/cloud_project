import logging
import json
import uuid
import azure.functions as func
import datetime as dt

from ..storage_helpers import get_table_client

MEALS_TABLE = "Meals"


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("HTTPRegisterMeal called.")

    # --- Parse JSON ---
    try:
        body = req.get_json()
    except:
        return _error("Invalid JSON")

    required = [
        "restaurantName",
        "dishName",
        "description",
        "prepTimeMinutes",
        "price",
        "deliveryArea",
    ]

    missing = [f for f in required if f not in body or body[f] in ("", None)]
    if missing:
        return _error(f"Missing fields: {', '.join(missing)}")

    # Clean values
    restaurantName = str(body["restaurantName"])
    dishName = str(body["dishName"])
    description = str(body["description"])

    try:
        prep = int(body["prepTimeMinutes"])
        price = float(body["price"])
    except:
        return _error("prepTimeMinutes must be int; price must be numeric")

    deliveryArea = str(body["deliveryArea"])

    # --- Table entity (Azure Table rules) ---
    entity = {
        "PartitionKey": deliveryArea,
        "RowKey": str(uuid.uuid4()),
        "RestaurantName": restaurantName,
        "DishName": dishName,
        "Description": description,
        "PrepTimeMinutes": prep,
        "Price": price,
        "CreatedAt": dt.datetime.utcnow().isoformat() + "Z",
    }

    try:
        table = get_table_client(MEALS_TABLE)
        table.create_table_if_not_exists()   # <-- THIS FIXES most failures
        table.create_entity(entity)
    except Exception as e:
        logging.error("ERROR INSERTING ENTITY:")
        logging.exception(e)
        return _error(f"Error saving meal: {str(e)}")

    return func.HttpResponse(
        json.dumps({"status": "ok", "mealId": entity["RowKey"]}),
        status_code=201,
        mimetype="application/json"
    )


def _error(msg):
    return func.HttpResponse(
        json.dumps({"status": "error", "message": msg}),
        status_code=400,
        mimetype="application/json"
    )
