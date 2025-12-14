import logging
import json
import uuid
import datetime as dt

import azure.functions as func

from ..storage_helpers import get_table_client

MEALS_TABLE = "Meals"


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("HTTPRegisterMeal processing request.")

    # Intentamos leer el body como JSON
    try:
        body = req.get_json()
    except ValueError:
        return _error("Invalid JSON")

    # Estos son EXACTAMENTE los campos que esperamos del frontend
    required = [
        "restaurantName",
        "dishName",
        "description",
        "prepTimeMinutes",
        "price",
        "deliveryArea",
    ]

    missing = [f for f in required if f not in body or body[f] in (None, "")]
    if missing:
        return _error(f"Missing fields: {', '.join(missing)}")

    # Validación numérica
    try:
        prep_minutes = int(body["prepTimeMinutes"])
        price = float(body["price"])
    except Exception:
        return _error("prepTimeMinutes must be int, price must be number")

    # Estructura CONSISTENTE con HTTPGetMealsByArea
    # HTTPGetMealsByArea lee: name, restaurantName, description, prepMinutes, price
    entity = {
        "PartitionKey": body["deliveryArea"],         # área de reparto
        "RowKey": str(uuid.uuid4()),
        "name": body["dishName"],                     # nombre del plato
        "restaurantName": body["restaurantName"],
        "description": body["description"],
        "prepMinutes": prep_minutes,
        "price": price,
        "imageUrl": body.get("imageUrl", ""),
        "lastUpdated": dt.datetime.utcnow().isoformat() + "Z",
    }

    try:
        table = get_table_client(MEALS_TABLE)
        table.create_table_if_not_exists()
        table.create_entity(entity)
    except Exception as e:
        logging.exception("Failed to create meal entity")
        return _error("Error saving meal")

    return func.HttpResponse(
        json.dumps({"status": "ok", "mealId": entity["RowKey"]}),
        mimetype="application/json",
    )


def _error(msg: str) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"status": "error", "message": msg}),
        status_code=400,
        mimetype="application/json",
    )
