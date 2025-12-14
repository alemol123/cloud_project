// TODO: change this once your Azure Functions URL is ready
const API_BASE = "food-functions-g2-excmeddydee6ame4.westeurope-01.azurewebsites.net";

document.addEventListener("DOMContentLoaded", () => {
  const loadMealsBtn = document.getElementById("load-meals-btn");
  const placeOrderBtn = document.getElementById("place-order-btn");
  const mealForm = document.getElementById("meal-form");

  if (mealForm) {
    mealForm.addEventListener("submit", handleMealSubmit);
  }
  if (loadMealsBtn) {
    loadMealsBtn.addEventListener("click", handleLoadMeals);
  }
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", handlePlaceOrder);
  }
});

// These functions will later call Azure Functions.
// For now they just log to console so you can see events are wired.

function handleMealSubmit(e) {
  e.preventDefault();
  console.log("Submitting new meal…");
}

function handleLoadMeals() {
  console.log("Loading meals for selected area…");
}

function handlePlaceOrder() {
  console.log("Placing order…");
}
