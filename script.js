const GOALS = {
  calories: 1700,
  protein: 100,
  carbs: 180,
  fat: 55,
  water: 3
};

const KEY = "foodtracker_v2";

let state;
try {
  state = JSON.parse(localStorage.getItem(KEY) || '{"meals":[],"water":0}');
} catch {
  state = { meals: [], water: 0 };
}

let foods = [];
let usdaTimer = null;
let selectedBaseNutrition = null;

const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function totals() {
  return state.meals.reduce(
    (a, m) => ({
      calories: a.calories + Number(m.calories || 0),
      protein: a.protein + Number(m.protein || 0),
      carbs: a.carbs + Number(m.carbs || 0),
      fat: a.fat + Number(m.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function render() {
  const t = totals();
  const p = Math.min(100, (t.calories / GOALS.calories) * 100);

  $("calories").textContent = Math.round(t.calories);
  $("protein").textContent = Math.round(t.protein);
  $("carbs").textContent = Math.round(t.carbs);
  $("fat").textContent = Math.round(t.fat);
  $("water").textContent = Number(state.water).toFixed(1);

  $("calBar").style.width = p + "%";
  $("calRing").style.setProperty("--deg", p * 3.6 + "deg");
  $("calPct").textContent = Math.round(p) + "%";

  $("mealSummary").textContent = state.meals.length
    ? `${state.meals.length} meal${state.meals.length === 1 ? "" : "s"} • ${Math.round(t.calories)} kcal`
    : "Nothing logged yet";

  renderMeals();
  $("adviceText").innerHTML = advice(t);

  if (!state.meals.length) {
    $("score").textContent = "—";
  } else {
    const score = Math.max(
      5,
      Math.min(
        10,
        5 +
          (t.protein / GOALS.protein) * 3 +
          (t.calories <= GOALS.calories ? 2 : 0)
      )
    );
    $("score").textContent = score.toFixed(1) + "/10";
  }
}

function renderMeals() {
  $("mealList").innerHTML = state.meals.map((m, i) => `
    <div class="meal">
      ${m.photo ? `<img src="${m.photo}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:10px;">` : ""}
      <div class="meal-main">
        <strong>${esc(m.name)}</strong>
        ${m.quantity ? `<small>${m.quantity} ${esc(m.unit || "g")}</small>` : ""}
        <div class="meal-macros">
          ${Math.round(m.protein)}g protein •
          ${Math.round(m.carbs)}g carbs •
          ${Math.round(m.fat)}g fat
        </div>
      </div>
      <div class="meal-kcal">
        ${Math.round(m.calories)}
        <small> kcal</small>
      </div>
      <button class="delete" type="button" data-index="${i}">×</button>
    </div>
  `).join("");

  document.querySelectorAll(".delete").forEach(button => {
    button.onclick = () => {
      state.meals.splice(Number(button.dataset.index), 1);
      save();
      render();
    };
  });
}

function advice(t) {
  if (!state.meals.length) {
    return "Add your first meal and I'll give you a simple nutrition check.";
  }

  const caloriesLeft = Math.round(GOALS.calories - t.calories);
  const proteinLeft = Math.round(GOALS.protein - t.protein);

  if (t.calories > GOALS.calories) {
    return `You've passed your <b>${GOALS.calories} kcal</b> target by ${Math.round(t.calories - GOALS.calories)} kcal. Keep the rest of today light and protein-focused.`;
  }

  if (proteinLeft > 0) {
    return `You have about <b>${Math.max(0, caloriesLeft)} kcal</b> and <b>${proteinLeft}g protein</b> left. A protein-rich meal would be a good next choice.`;
  }

  return `Nice work — you're at <b>${Math.round(t.protein)}g protein</b>. You have about <b>${Math.max(0, caloriesLeft)} kcal</b> remaining today.`;
}

async function loadFoods() {
  try {
    const response = await fetch("./foods.json?v=4", { cache: "no-store" });
    if (!response.ok) throw new Error("foods.json HTTP " + response.status);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("foods.json is not an array");

    foods = data;
    console.log("FoodTracker: loaded", foods.length, "local foods");
  } catch (error) {
    foods = [];
    console.error("Food database failed:", error);
  }
}

function getQuantity() {
  return Number($("quantityInput").value) || 0;
}

function setBaseNutrition(data) {
  selectedBaseNutrition = {
    calories: Number(data.calories) || 0,
    protein: Number(data.protein) || 0,
    carbs: Number(data.carbs) || 0,
    fat: Number(data.fat) || 0,
    baseQuantity: Number(data.baseQuantity) || 100,
    baseUnit: data.baseUnit || "g"
  };

  $("unitInput").value = selectedBaseNutrition.baseUnit;
  $("quantityInput").value = selectedBaseNutrition.baseQuantity;

  updateNutritionFromQuantity();
}

function updateNutritionFromQuantity() {
  if (!selectedBaseNutrition) return;

  const quantity = getQuantity();
  if (quantity <= 0) return;

  const multiplier =
    quantity / selectedBaseNutrition.baseQuantity;

  $("caloriesInput").value =
    (selectedBaseNutrition.calories * multiplier).toFixed(1);

  $("proteinInput").value =
    (selectedBaseNutrition.protein * multiplier).toFixed(1);

  $("carbsInput").value =
    (selectedBaseNutrition.carbs * multiplier).toFixed(1);

  $("fatInput").value =
    (selectedBaseNutrition.fat * multiplier).toFixed(1);

  $("quantityNote").textContent =
    `Calculated from ${selectedBaseNutrition.baseQuantity} ${selectedBaseNutrition.baseUnit}.`;
}

function fillLocalFood(food) {
  $("foodName").value = food.name;

  setBaseNutrition({
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    baseQuantity: food.baseQuantity || 100,
    baseUnit: food.baseUnit || "g"
  });

  $("suggestions").innerHTML = "";
}

function getNutrient(food, nutrientId) {
  const nutrients = Array.isArray(food.foodNutrients)
    ? food.foodNutrients
    : [];

  const item = nutrients.find(
    n => Number(n.nutrientId) === nutrientId
  );

  return item ? Number(item.value || 0) : 0;
}

function fillUSDAFood(food) {
  setBaseNutrition({
    calories: getNutrient(food, 1008),
    protein: getNutrient(food, 1003),
    carbs: getNutrient(food, 1005),
    fat: getNutrient(food, 1004),
    baseQuantity: 100,
    baseUnit: "g"
  });

  $("foodName").value =
    food.description ||
    food.lowercaseDescription ||
    "Food";

  $("suggestions").innerHTML = "";
}

async function searchUSDA(query) {
  try {
    const response = await fetch(
      `/api/foods?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data.foods) ? data.foods : [];
  } catch (error) {
    console.warn("USDA search unavailable:", error);
    return [];
  }
}

function showLocalResults(results) {
  $("suggestions").innerHTML = `
    <div style="padding:6px 10px;font-size:12px;opacity:.7;">
      Local foods
    </div>
    ${results.map((food, i) => `
      <button type="button" data-local-index="${i}">
        ${esc(food.name)}
      </button>
    `).join("")}
  `;

  document
    .querySelectorAll("#suggestions [data-local-index]")
    .forEach(button => {
      button.onclick = () => {
        fillLocalFood(results[Number(button.dataset.localIndex)]);
      };
    });
}

function showUSDAResults(results) {
  if (!results.length) {
    $("suggestions").innerHTML = `
      <div style="padding:10px;">No matching food found.</div>
    `;
    return;
  }

  $("suggestions").innerHTML = `
    <div style="padding:6px 10px;font-size:12px;opacity:.7;">
      USDA results
    </div>
    ${results.slice(0, 8).map((food, i) => `
      <button type="button" data-usda-index="${i}">
        ${esc(food.description || "Food")}
      </button>
    `).join("")}
  `;

  document
    .querySelectorAll("#suggestions [data-usda-index]")
    .forEach(button => {
      button.onclick = () => {
        fillUSDAFood(results[Number(button.dataset.usdaIndex)]);
      };
    });
}

$("foodName").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();

  clearTimeout(usdaTimer);
  selectedBaseNutrition = null;

  if (!query) {
    $("suggestions").innerHTML = "";
    return;
  }

  const localResults = foods
    .filter(food =>
      String(food.name || "").toLowerCase().includes(query)
    )
    .slice(0, 8);

  if (localResults.length) {
    showLocalResults(localResults);
  } else {
    $("suggestions").innerHTML = `
      <div style="padding:10px;font-size:13px;">
        Searching online foods...
      </div>
    `;
  }

  usdaTimer = setTimeout(async () => {
    const results = await searchUSDA(query);

    if (results.length && !localResults.length) {
      showUSDAResults(results);
    }
  }, 500);
});

$("quantityInput").addEventListener("input", () => {
  updateNutritionFromQuantity();
});

$("unitInput").addEventListener("change", () => {
  if (!selectedBaseNutrition) {
    $("quantityNote").textContent = "Select a food first.";
    return;
  }

  $("quantityNote").textContent =
    `Nutrition calculated using ${$("unitInput").value}.`;
});

$("addMeal").addEventListener("click", () => {
  const name = $("foodName").value.trim();

  if (!name) {
    alert("Please enter a food name.");
    return;
  }

  const meal = {
    name,
    quantity: getQuantity(),
    unit: $("unitInput").value || "g",
    calories: Number($("caloriesInput").value) || 0,
    protein: Number($("proteinInput").value) || 0,
    carbs: Number($("carbsInput").value) || 0,
    fat: Number($("fatInput").value) || 0,
    photo: window.pendingPhoto || ""
  };

  state.meals.push(meal);
  window.pendingPhoto = "";

  [
    "foodName",
    "quantityInput",
    "caloriesInput",
    "proteinInput",
    "carbsInput",
    "fatInput"
  ].forEach(id => {
    $(id).value = "";
  });

  $("unitInput").value = "g";
  $("quantityNote").textContent =
    "Select a food to calculate nutrition automatically.";
  $("suggestions").innerHTML = "";

  selectedBaseNutrition = null;

  save();
  render();
});

$("photoBtn").addEventListener("click", () => {
  $("photoInput").click();
});

$("photoInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    window.pendingPhoto = reader.result;
    alert("Photo attached. Add the food details, then tap Add meal.");
  };

  reader.readAsDataURL(file);
});

$("waterBtn").addEventListener("click", () => {
  state.water = Math.min(
    GOALS.water,
    Number(state.water) + 0.25
  );

  save();
  render();
});

$("resetDay").addEventListener("click", () => {
  if (confirm("Reset today's meals and water?")) {
    state = {
      meals: [],
      water: 0
    };

    save();
    render();
  }
});

async function startApp() {
  await loadFoods();
  render();
}

startApp();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => {
        console.warn("Service worker registration failed:", error);
      });
  });
}
