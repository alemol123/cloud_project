// ===============================
// Configuration
// ===============================

const API_BASE =
  "food-functions-g2-excmeddydee6ame4.westeurope-01.azurewebsites.net";

// Deben coincidir con las "route" de los function.json
const ENDPOINTS = {
  meals: "meals",          // GET  /api/meals?area=Central
  registerMeal: "registerMeal", // POST /api/registerMeal
  submitOrder: "submitOrder"    // POST /api/submitOrder
};

// Últimos platos cargados (se usan para el pedido)
let currentMeals = [];

// ===============================
// Page bootstrap
// ===============================

window.addEventListener("DOMContentLoaded", () => {
  // Customer view
  const loadMealsBtn = document.getElementById("load-meals-btn");
  if (loadMealsBtn) {
    loadMealsBtn.addEventListener("click", loadMeals);

    const placeOrderBtn = document.getElementById("place-order-btn");
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", submitOrder);
    }
    return;
  }

  // Restaurant view
  const registerMealBtn = document.getElementById("register-meal-btn");
  if (registerMealBtn) {
    registerMealBtn.addEventListener("click", registerMeal);
    return;
  }
});

// ===============================
// Customer view – load meals
// ===============================

async function loadMeals() {
  const areaSelect = document.getElementById("delivery-area");
  const area = areaSelect.value;

  const mealsContainer = document.getElementById("meals-container");
  mealsContainer.textContent = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE}/${ENDPOINTS.meals}?area=${encodeURIComponent(area)}`
    );

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    const meals = Array.isArray(data) ? data : data.meals;

    if (!Array.isArray(meals)) {
      throw new Error("Invalid response format from API");
    }

    currentMeals = meals;
    renderMeals(meals);
  } catch (err) {
    console.error("Error loading meals:", err);
    mealsContainer.textContent = "Failed to load meals.";
  }
}

function renderMeals(meals) {
  const mealsContainer = document.getElementById("meals-container");
  mealsContainer.innerHTML = "";

  if (!meals.length) {
    mealsContainer.textContent = "No meals available in this area.";
    return;
  }

  meals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "meal-card";

    const title = meal.name ?? meal.dishName ?? "Unnamed meal";
    const price = Number(meal.price ?? 0);
    const prep =
      meal.prepMinutes ?? meal.prepTimeMinutes ?? meal.prepTimeMinutes ?? null;
    const prepText = prep != null ? `${prep} min` : "N/A min";

    card.innerHTML = `
      <label>
        <input
          type="checkbox"
          class="meal-checkbox"
          data-meal-id="${meal.mealId || meal.id}"
        />
        <strong>${title}</strong> – €${price.toFixed(2)}
      </label>
      <div>Restaurant: ${meal.restaurantName || "N/A"}</div>
      <div>${meal.description || ""}</div>
      <div>Prep time: ${prepText}</div>
      <label>
        Quantity:
        <input
          type="number"
          min="1"
          value="1"
          class="meal-quantity"
          data-meal-id="${meal.mealId || meal.id}"
        />
      </label>
    `;

    mealsContainer.appendChild(card);
  });
}

// ===============================
// Customer view – submit order
// ===============================

async function submitOrder(evt) {
  evt.preventDefault();

  const nameInput = document.getElementById("customer-name");
  const addressInput = document.getElementById("customer-address");
  const statusEl = document.getElementById("order-status");

  const customerName = nameInput.value.trim();
  const customerAddress = addressInput.value.trim();

  if (!customerName || !customerAddress) {
    setStatus(statusEl, "Please enter your name and address.", true);
    return;
  }

  // Map de mealId -> quantity
  const checkedIds = new Set();
  const quantities = new Map();

  document.querySelectorAll(".meal-checkbox").forEach((cb) => {
    if (cb.checked) {
      const mealId = cb.dataset.mealId;
      checkedIds.add(mealId);
    }
  });

  if (checkedIds.size === 0) {
    setStatus(statusEl, "Please select at least one meal.", true);
    return;
  }

  document.querySelectorAll(".meal-quantity").forEach((input) => {
    const mealId = input.dataset.mealId;
    const qty = Number(input.value) || 0;
    if (checkedIds.has(mealId)) {
      quantities.set(mealId, qty > 0 ? qty : 1);
    }
  });

  // Muy importante: usar prepTimeMinutes (lo que espera la Function)
  const selectedMeals = currentMeals
    .filter((m) => checkedIds.has(m.mealId || m.id))
    .map((m) => ({
      mealId: m.mealId || m.id,
      name: m.name ?? m.dishName,
      restaurantName: m.restaurantName,
      price: Number(m.price ?? 0),
      prepTimeMinutes: m.prepMinutes ?? m.prepTimeMinutes ?? 0,
      quantity: quantities.get(m.mealId || m.id) || 1,
    }));

  if (!selectedMeals.length) {
    setStatus(
      statusEl,
      "Failed to place order: no matching meals found in local list.",
      true
    );
    return;
  }

  const payload = {
    customerName,
    customerAddress,
    area: document.getElementById("delivery-area").value,
    selectedMeals,
  };

  try {
    setStatus(statusEl, "Submitting order...");

    const res = await fetch(`${API_BASE}/${ENDPOINTS.submitOrder}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status === "error") {
      const msg =
        data && data.message
          ? data.message
          : `HTTP error ${res.status} placing order`;
      throw new Error(msg);
    }

    const totalCost = data.totalCost ?? 0;
    const est = data.estimatedDeliveryTimeMinutes ?? 0;

    setStatus(
      statusEl,
      `Order placed! Total €${totalCost.toFixed(
        2
      )}. Estimated delivery: ${est} min.`,
      false
    );
  } catch (err) {
    console.error("Error placing order:", err);
    setStatus(
      statusEl,
      `Error placing order: ${err.message || "Unknown error"}`,
      true
    );
  }
}

function setStatus(el, msg, isError = false) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? "red" : "green";
}

// ===============================
// Restaurant view – register meal
// ===============================

async function registerMeal(evt) {
  evt.preventDefault();

  const restaurantNameInput = document.getElementById("restaurant-name");
  const dishNameInput = document.getElementById("dish-name");
  const descriptionInput = document.getElementById("description");
  const prepTimeInput = document.getElementById("prep-time");
  const priceInput = document.getElementById("price");
  const areaSelect = document.getElementById("restaurant-area");
  const imageUrlInput = document.getElementById("image-url");
  const statusEl = document.getElementById("register-status");

  const restaurantName = restaurantNameInput.value.trim();
  const dishName = dishNameInput.value.trim();
  const description = descriptionInput.value.trim();
  const prepTimeStr = prepTimeInput.value.trim();
  const priceStr = priceInput.value.trim();
  const area = areaSelect.value;
  const imageUrl = imageUrlInput.value.trim();

  const missing = [];
  if (!restaurantName) missing.push("restaurantName");
  if (!dishName) missing.push("dishName");
  if (!description) missing.push("description");
  if (!prepTimeStr) missing.push("prepTimeMinutes");
  if (!priceStr) missing.push("price");
  if (!area) missing.push("deliveryArea");

  if (missing.length > 0) {
    setStatus(statusEl, `Missing fields: ${missing.join(", ")}`, true);
    return;
  }

  const prepMinutes = Number(prepTimeStr);
  const price = Number(priceStr);

  if (Number.isNaN(prepMinutes) || prepMinutes <= 0) {
    setStatus(statusEl, "Prep time must be a positive number.", true);
    return;
  }

  if (Number.isNaN(price) || price <= 0) {
    setStatus(statusEl, "Price must be a positive number.", true);
    return;
  }

  // IMPORTANTE: nombres que espera HTTPRegisterMeal
  const payload = {
    restaurantName,
    dishName,
    description,
    prepTimeMinutes: prepMinutes,
    price,
    deliveryArea: area,
    imageUrl,
  };

  try {
    setStatus(statusEl, "Registering meal...");

    const res = await fetch(`${API_BASE}/${ENDPOINTS.registerMeal}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status === "error") {
      const msg =
        data && data.message
          ? data.message
          : `HTTP error ${res.status} registering meal`;
      throw new Error(msg);
    }

    setStatus(statusEl, "Meal registered successfully!", false);

    // Limpiamos los campos
    dishNameInput.value = "";
    descriptionInput.value = "";
    prepTimeInput.value = "";
    priceInput.value = "";
    imageUrlInput.value = "";
  } catch (err) {
    console.error("Error registering meal:", err);
    setStatus(
      statusEl,
      `Error registering meal: ${err.message || "Unknown error"}`,
      true
    );
  }
}
