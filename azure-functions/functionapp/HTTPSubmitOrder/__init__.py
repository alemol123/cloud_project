import logging
import json
import uuid
import datetime as dt

import azure.functions as func

from ..storage_helpers import get_table_client, get_queue_client

ORDERS_TABLE = "Orders"
INVALID_ORDERS_QUEUE = "invalid-orders"

FIXED_PICKUP_MIN = 10
FIXED_DELIVERY_MIN = 20

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("HTTPSubmitOrder called.")

    try:
        body = req.get_json()
    except ValueError:
        return _invalid(None, "Invalid JSON")

    required = ["area", "customerName", "customerAddress", "selectedMeals"]
    missing = [f for f in required if f not in body or body[f] in (None, "", [])]
    if missing:
        return _invalid(body, f"Missing fields: {', '.join(missing)}")

    selected_meals = body["selectedMeals"]
    if not isinstance(selected_meals, list) or len(selected_meals) == 0:
        return _invalid(body, "selectedMeals must be a non-empty array")

    total_cost = 0.0
    total_prep = 0

    try:
        for meal in selected_meals:
            qty = int(meal["quantity"])
            price = float(meal["price"])
            prep = int(meal["prepTimeMinutes"])
            total_cost += qty * price
            total_prep += qty * prep
    except:
        return _invalid(body, "Invalid meal entry in selectedMeals")

    est_delivery = total_prep + FIXED_PICKUP_MIN + FIXED_DELIVERY_MIN
    order_id = str(uuid.uuid4())

    entity = {
        "PartitionKey": body["area"],
        "RowKey": order_id,
        "CustomerName": body["customerName"],
        "CustomerAddress": body["customerAddress"],
        "MealsJson": json.dumps(selected_meals),
        "TotalPrice": total_cost,
        "EstimatedDeliveryTimeMinutes": est_delivery,
        "CreatedAt": dt.datetime.utcnow().isoformat() + "Z"
    }

    try:
        table = get_table_client(ORDERS_TABLE)
        table.create_table_if_not_exists()
        table.create_entity(entity)
    except Exception:
        logging.exception("Failed to write order entity")
        return _invalid(body, "Error saving order")

    return func.HttpResponse(
        json.dumps({
            "status": "ok",
            "orderId": order_id,
            "totalCost": round(total_cost, 2),
            "estimatedDeliveryTimeMinutes": est_delivery
        }),
        mimetype="application/json"
    )


def _invalid(payload, reason):
    """Log invalid orders to queue + return error."""
    logging.warning(f"Invalid order: {reason}")
    try:
        queue = get_queue_client(INVALID_ORDERS_QUEUE)
        queue.create_queue()
        queue.send_message(json.dumps({
            "reason": reason,
            "payload": payload
        }))
    except:
        logging.exception("Failed to send message to invalid-orders queue")

    return func.HttpResponse(
        json.dumps({"status": "error", "message": reason}),
        status_code=400,
        mimetype="application/json"
    )
