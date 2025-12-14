// ---------- CONFIG ----------
const API_BASE = "https://food-functions-g2-excmeddydee6ame4.westeurope-01.azurewebsites.net/api";




let currentMeals = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("load-meals-btn")?.addEventListener("click", handleLoadMeals);
  document.getElementById("place-order-btn")?.addEventListener("click", handlePlaceOrder);
  document.getElementById("meal-form")?.addEventListener("submit", handleMealSubmit);
});

// ---------- RESTAURANT SIDE ----------
async function handleMealSubmit(e) {
  e.preventDefault();

  const restaurantName = document.getElementById("restaurant-name").value.trim();
  const dishName       = document.getElementById("dish-name").value.trim();
  const description    = document.getElementById("dish-description").value.trim();
  const prepTime       = document.getElementById("prep-time").value;
  const price          = document.getElementById("price").value;
  const deliveryArea   = document.getElementById("delivery-area").value;
  const imageUrl       = document.getElementById("image-url").value.trim();
  const messageEl      = document.getElementById("restaurant-message");

  if (!restaurantName || !dishName || !description || !prepTime || !price || !deliveryArea) {
    messageEl.textContent = "Please fill all required fields.";
    messageEl.style.color = "red";
    return;
  }

 const payload = {
  restaurantName,
  dishName,                   
  description,
  prepTimeMinutes: Number(prepTime),
  price: Number(price),
  deliveryArea,
  imageUrl: imageUrl || undefined
};

  try {
    const res = await fetch(`${API_BASE}/registerMeal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      console.error("Register meal error:", data);
      messageEl.textContent = data.message || "Error registering meal.";
      messageEl.style.color = "red";
      return;
    }

    messageEl.textContent = "Meal registered successfully!";
    messageEl.style.color = "green";
    e.target.reset();
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Network error while registering meal.";
    messageEl.style.color = "red";
  }
}

// ---------- CUSTOMER SIDE ----------
async function handleLoadMeals() {
  const areaSelect     = document.getElementById("area-select");
  const area           = areaSelect.value;
  const mealsContainer = document.getElementById("meals-container");

  if (!area) {
    alert("Please select a delivery area.");
    return;
  }

  mealsContainer.textContent = "Loading meals…";

  try {
    const res = await fetch(`${API_BASE}/meals?area=${encodeURIComponent(area)}`);
    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      console.error("Get meals error:", data);
      mealsContainer.textContent = data.message || "Failed to load meals.";
      return;
    }

    currentMeals = data.meals || [];
    renderMeals(mealsContainer, currentMeals);
  } catch (err) {
    console.error(err);
    mealsContainer.textContent = "Network error while loading meals.";
  }
}

// map Azure entity fields -> what we show in UI
function renderMeals(container, meals) {
  if (!meals.length) {
    container.textContent = "No meals available in this area.";
    return;
  }

  container.innerHTML = "";
  meals.forEach((meal, idx) => {
    // Azure fields:
    //  - meal.name           (dish name)
    //  - meal.restaurantName
    //  - meal.description
    //  - meal.prepTimeMinutes
    //  - meal.price
    const dishName       = meal.name || "Unnamed meal";
    const restaurantName = meal.restaurantName || "N/A";
    const prepTime       = meal.prepTimeMinutes ?? null;
    const priceRaw       = meal.price ?? null;
    const priceNumber    = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
    const priceText      = isNaN(priceNumber) ? "N/A" : priceNumber.toFixed(2);

    const card = document.createElement("div");
    card.className = "meal-card";

    const checkboxId = `meal-check-${idx}`;
    const qtyId      = `meal-qty-${idx}`;

    card.innerHTML = `
      <label>
        <input type="checkbox" id="${checkboxId}" data-index="${idx}">
        <strong>${dishName}</strong> – €${priceText}
      </label>
      <div>Restaurant: ${restaurantName}</div>
      <div>${meal.description || ""}</div>
      <div>Prep time: ${prepTime ?? "N/A"} min</div>
      <label>
        Quantity:
        <input type="number" id="${qtyId}" data-index="${idx}" value="1" min="1" style="width: 60px;">
      </label>
    `;

    container.appendChild(card);
  });
}

async function handlePlaceOrder() {
  const area            = document.getElementById("area-select").value;
  const customerName    = document.getElementById("customer-name").value.trim();
  const customerAddress = document.getElementById("customer-address").value.trim();
  const confirmationEl  = document.getElementById("order-confirmation");

  if (!area || !customerName || !customerAddress) {
    alert("Please fill your details and select an area.");
    return;
  }

  const selectedMeals = [];
  currentMeals.forEach((meal, idx) => {
    const checkbox = document.getElementById(`meal-check-${idx}`);
    const qtyInput = document.getElementById(`meal-qty-${idx}`);
    if (checkbox && checkbox.checked) {
      const qty = Number(qtyInput.value || 0);
      if (qty > 0) {
        const dishName       = meal.name || "Unnamed meal";
        const restaurantName = meal.restaurantName || "N/A";
        const prepTime       = meal.prepTimeMinutes ?? null;
        const priceRaw       = meal.price ?? null;
        const priceNumber    = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);

        selectedMeals.push({
          // RowKey is a good fallback if your function doesn’t explicitly set mealId
          mealId:          meal.mealId || meal.RowKey || null,
          quantity:        qty,
          price:           priceNumber,
          prepTimeMinutes: prepTime,
          dishName,
          restaurantName
        });
      }
    }
  });

  if (!selectedMeals.length) {
    alert("Please select at least one meal.");
    return;
  }

  const payload = {
    area,
    customerName,
    customerAddress,
    selectedMeals
  };

  try {
    const res  = await fetch(`${API_BASE}/submitOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      console.error("Submit order error:", data);
      confirmationEl.classList.remove("hidden");
      confirmationEl.style.color = "red";
      confirmationEl.innerHTML = `<p>Failed to place order: ${data.message || "Unknown error"}</p>`;
      return;
    }

    confirmationEl.classList.remove("hidden");
    confirmationEl.style.color = "green";
    confirmationEl.innerHTML = `
      <h3>Order confirmed!</h3>
      <p>Order ID: ${data.orderId}</p>
      <p>Total cost: €${data.totalCost.toFixed(2)}</p>
      <p>Estimated delivery time: ${data.estimatedDeliveryTimeMinutes} minutes</p>
    `;
  } catch (err) {
    console.error(err);
    confirmationEl.classList.remove("hidden");
    confirmationEl.style.color = "red";
    confirmationEl.innerHTML = "<p>Network error while placing order.</p>";
  }
}
