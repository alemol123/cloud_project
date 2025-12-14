// ===============================
//  Configuration
// ===============================

const API_BASE = "https://food-functions-g2-excmeddydee6ame4.westeurope-01.azurewebsites.net/api";

// If your function routes are named differently, change them here.
const ENDPOINTS = {
  meals: "meals",             // GET  /api/meals?area=Central
  registerMeal: "registermeal", // POST /api/registermeal   (or whatever you used)
  submitOrder: "submitorder"    // POST /api/submitorder    (or /orders)
};

// Store last loaded meals so we can use them when placing orders
let currentMeals = [];

// ===============================
//  Page bootstrap
// ===============================

window.addEventListener("DOMContentLoaded", () => {
  // Customer view?
  const loadMealsBtn = document.getElementById("load-meals-btn");
  if (loadMealsBtn) {
    loadMealsBtn.addEventListener("click", loadMeals);

    const placeOrderBtn = document.getElementById("place-order-btn");
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", submitOrder);
    }

    return;
  }

  // Restaurant view?
  const registerMealBtn = document.getElementById("register-meal-btn");
  if (registerMealBtn) {
    registerMealBtn.addEventListener("click", registerMeal);
    return;
  }
});

// ===============================
//  Customer view – load meals
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

    // Your API returns a plain array: [ {...}, {...} ]
    // But keep it flexible in case you ever wrap it.
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

  meals.forEach(meal => {
    const card = document.createElement("div");
    card.className = "meal-card";

    const title = meal.name ?? meal.dishName ?? "Unnamed meal";
    const price = Number(meal.price ?? 0);

    const prep = meal.prepMinutes ?? meal.prepTimeMinutes ?? null;
    const prepText = prep != null ? `${prep} min` : "N/A min";

    card.innerHTML = `
      <label>
        <input
          type="checkbox"
          class="meal-checkbox"
          data-meal-id="${meal.mealId}"
        >
        <strong>${title}</strong> – €${price.toFixed(2)}
      </label>
      <div>Restaurant: ${meal.restaurantName || "N/A"}</div>
      <div>${meal.description || ""}</div>
      <div>Prep time: ${prepText}</div>
      <div>
        Quantity:
        <input
          type="number"
          class="meal-quantity"
          data-meal-id="${meal.mealId}"
          value="1"
          min="1"
        >
      </div>
    `;

    mealsContainer.appendChild(card);
  });
}

// ===============================
//  Customer view – submit order
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

  // Map of mealId -> quantity
  const checkedIds = new Set();
  const quantities = new Map();

  document.querySelectorAll(".meal-checkbox").forEach(cb => {
    if (cb.checked) {
      const mealId = cb.dataset.mealId;
      checkedIds.add(mealId);
    }
  });

  if (checkedIds.size === 0) {
    setStatus(statusEl, "Please select at least one meal.", true);
    return;
  }

  document.querySelectorAll(".meal-quantity").forEach(input => {
    const mealId = input.dataset.mealId;
    const qty = Number(input.value) || 0;
    if (checkedIds.has(mealId)) {
      quantities.set(mealId, qty > 0 ? qty : 1);
    }
  });

  const selectedMeals = currentMeals
    .filter(m => checkedIds.has(m.mealId))
    .map(m => ({
      mealId: m.mealId,
      name: m.name ?? m.dishName,
      price: Number(m.price ?? 0),
      restaurantName: m.restaurantName,
      // Backend expects 'prepMinutes'
      prepMinutes: m.prepMinutes ?? m.prepTimeMinutes ?? 0,
      quantity: quantities.get(m.mealId) || 1
    }));

  if (!selectedMeals.length) {
    setStatus(
      statusEl,
      "Failed to place order: no matching meals found in local list.",
      true
    );
    return;
  }

  const totalCost = selectedMeals.reduce(
    (sum, m) => sum + m.price * m.quantity,
    0
  );

  const totalPrepMinutes = selectedMeals.reduce(
    (sum, m) => sum + (m.prepMinutes || 0) * m.quantity,
    0
  );

  // Simple estimate: sum prep + 10 min pickup + 20 min delivery
  const estimatedMinutes = totalPrepMinutes + 10 + 20;

  const payload = {
    customerName,
    customerAddress,
    area: document.getElementById("delivery-area").value,
    selectedMeals,
    totalCost,
    estimatedMinutes
  };

  try {
    setStatus(statusEl, "Submitting order...");

    const res = await fetch(`${API_BASE}/${ENDPOINTS.submitOrder}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status === "error") {
      const msg =
        data && data.message
          ? data.message
          : `HTTP error ${res.status} placing order`;
      throw new Error(msg);
    }

    const confirmation = data.confirmation || data;
    setStatus(
      statusEl,
      `Order placed! Total €${totalCost.toFixed(
        2
      )}. Estimated delivery: ${estimatedMinutes} min.`,
      false
    );
  } catch (err) {
    console.error("Error placing order:", err);
    setStatus(
      statusEl,
      `Failed to place order: ${err.message || "Unknown error"}`,
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
//  Restaurant view – register meal
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
  if (!prepTimeStr) missing.push("prepMinutes");
  if (!priceStr) missing.push("price");

  if (missing.length > 0) {
    setStatus(
      statusEl,
      `Missing fields: ${missing.join(", ")}`,
      true
    );
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

  const payload = {
    restaurantName,
    // Backend property is 'name' (we treat dishName as name)
    name: dishName,
    description,
    prepMinutes,
    price,
    area,
    imageUrl
  };

  try {
    setStatus(statusEl, "Registering meal...");

    const res = await fetch(`${API_BASE}/${ENDPOINTS.registerMeal}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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

    // Optionally clear inputs
    dishNameInput.value = "";
    descriptionInput.value = "";
    prepTimeInput.value = "";
    priceInput.value = "";
    imageUrlInput.value = "";
  } catch (err) {
    console.error("Error registering meal:", err);
    setStatus(
      statusEl,
      `Network error while registering meal. ${err.message || ""}`,
      true
    );
  }
}
