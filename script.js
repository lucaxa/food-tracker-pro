const GOALS = {
calories: 1700,
protein: 100,
carbs: 180,
fat: 55,
water: 3
};

const KEY = "foodtracker_v2";

let state = JSON.parse(
localStorage.getItem(KEY) || '{"meals":[],"water":0}'
);

let foods = [];
let usdaTimer = null;
let selectedBaseNutrition = null;

const $ = id => document.getElementById(id);

function save() {
localStorage.setItem(KEY, JSON.stringify(state));
}

/* -----------------------------
TOTALS
----------------------------- */

function totals() {
return state.meals.reduce(
(a, m) => ({
calories: a.calories + Number(m.calories || 0),
protein: a.protein + Number(m.protein || 0),
carbs: a.carbs + Number(m.carbs || 0),
fat: a.fat + Number(m.fat || 0)
}),
{
calories: 0,
protein: 0,
carbs: 0,
fat: 0
}
);
}

/* -----------------------------
ESCAPE HTML
----------------------------- */

function esc(s) {
return String(s).replace(/[&<>"']/g, c => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
}[c]));
}

/* -----------------------------
RENDER
----------------------------- */

function render() {
const t = totals();

const p = Math.min(
100,
(t.calories / GOALS.calories) * 100
);

$("calories").textContent = Math.round(t.calories);
$("protein").textContent = Math.round(t.protein);
$("carbs").textContent = Math.round(t.carbs);
$("fat").textContent = Math.round(t.fat);
$("water").textContent = state.water.toFixed(1);

$("calBar").style.width = p + "%";
$("calRing").style.setProperty(
"--deg",
p * 3.6 + "deg"
);

$("calPct").textContent =
Math.round(p) + "%";

$("mealSummary").textContent =
state.meals.length
? `${state.meals.length} meal${
          state.meals.length === 1 ? "" : "s"
        } • ${Math.round(t.calories)} kcal`
: "Nothing logged yet";

$("mealList").innerHTML =
state.meals
.map(
(m, i) => ` <div class="meal">

```
        ${
          m.photo
            ? `<img src="${m.photo}" style="width:50px;height:50px;object-fit:cover;border-radius:10px;">`
            : ""
        }

        <div class="meal-main">

          <b>${esc(m.name)}</b>

          ${
            m.quantity
              ? `<small>${m.quantity} ${esc(
                  m.unit || "g"
                )}</small>`
              : ""
          }

          <small>
            ${Math.round(m.protein)}g protein •
            ${Math.round(m.carbs)}g carbs •
            ${Math.round(m.fat)}g fat
          </small>

        </div>

        <div class="meal-kcal">
          ${Math.round(m.calories)}
          <small> kcal</small>
        </div>

        <button
          class="delete"
          data-i="${i}"
        >×</button>

      </div>
    `
  )
  .join("");
```

document
.querySelectorAll(".delete")
.forEach(button => {
button.onclick = () => {
state.meals.splice(
Number(button.dataset.i),
1
);

```
    save();
    render();
  };
});
```

$("adviceText").innerHTML = advice(t);

$("score").textContent =
state.meals.length
? Math.max(
5,
Math.min(
10,
5 +
(t.protein / GOALS.protein) * 3 +
(t.calories <= GOALS.calories ? 2 : 0)
)
).toFixed(1) + "/10"
: "—";
}

/* -----------------------------
COACH
----------------------------- */

function advice(t) {
if (!state.meals.length) {
return "Add your first meal and I'll give you a simple nutrition check.";
}

const cal = Math.round(
GOALS.calories - t.calories
);

const pro = Math.round(
GOALS.protein - t.protein
);

if (t.calories > GOALS.calories) {
return `You've passed your <b>${GOALS.calories} kcal</b> target by ${Math.round(
      t.calories - GOALS.calories
    )} kcal. Keep the rest of today light and protein-focused.`;
}

if (pro > 0) {
return `You have about <b>${Math.max(
      0,
      cal
    )} kcal</b> and <b>${pro}g protein</b> left. A protein-rich meal would be a good next choice.`;
}

return `Nice work — you're at <b>${Math.round(
    t.protein
  )}g protein</b>. You have about <b>${Math.max(
    0,
    cal
  )} kcal</b> remaining today.`;
}

/* -----------------------------
LOCAL FOOD DATABASE
----------------------------- */

async function loadFoods() {
try {
const response = await fetch(
"./foods.json",
{
cache: "no-store"
}
);

```
if (!response.ok) {
  throw new Error(
    `foods.json failed: ${response.status}`
  );
}

const data = await response.json();

foods = Array.isArray(data)
  ? data
  : [];

console.log(
  `Food database loaded: ${foods.length} foods`
);
```

} catch (error) {
console.error(
"Local food database error:",
error
);

```
foods = [];
```

}
}

/* -----------------------------
QUANTITY
----------------------------- */

function getQuantity() {
return Number(
$("quantityInput").value
) || 0;
}

function updateNutritionFromQuantity() {
if (!selectedBaseNutrition) {
return;
}

const quantity = getQuantity();

if (quantity <= 0) {
return;
}

const baseQuantity =
Number(
selectedBaseNutrition.baseQuantity
) || 100;

const multiplier =
quantity / baseQuantity;

$("caloriesInput").value =
(
selectedBaseNutrition.calories *
multiplier
).toFixed(1);

$("proteinInput").value =
(
selectedBaseNutrition.protein *
multiplier
).toFixed(1);

$("carbsInput").value =
(
selectedBaseNutrition.carbs *
multiplier
).toFixed(1);

$("fatInput").value =
(
selectedBaseNutrition.fat *
multiplier
).toFixed(1);

$("quantityNote").textContent =
`Calculated from ${baseQuantity} ${selectedBaseNutrition.baseUnit}.`;
}

function setBaseNutrition({
calories = 0,
protein = 0,
carbs = 0,
fat = 0,
baseQuantity = 100,
baseUnit = "g"
}) {
selectedBaseNutrition = {
calories: Number(calories) || 0,
protein: Number(protein) || 0,
carbs: Number(carbs) || 0,
fat: Number(fat) || 0,
baseQuantity:
Number(baseQuantity) || 100,
baseUnit: baseUnit || "g"
};

$("unitInput").value =
selectedBaseNutrition.baseUnit;

$("quantityInput").value =
selectedBaseNutrition.baseQuantity;

updateNutritionFromQuantity();
}

/* -----------------------------
LOCAL FOOD SELECTION
----------------------------- */

function fill(food) {
$("foodName").value =
food.name;

setBaseNutrition({
calories: food.calories,
protein: food.protein,
carbs: food.carbs,
fat: food.fat,
baseQuantity:
food.baseQuantity || 100,
baseUnit:
food.baseUnit || "g"
});

$("suggestions").innerHTML = "";
}

/* -----------------------------
USDA NUTRIENTS
----------------------------- */

function getNutrient(food, nutrientId) {
const item =
food.foodNutrients?.find(
n =>
Number(n.nutrientId) ===
nutrientId
);

return item
? Number(item.value || 0)
: 0;
}

/* -----------------------------
USDA FOOD SELECTION
----------------------------- */

function fillUSDA(food) {
const calories =
getNutrient(food, 1008);

const protein =
getNutrient(food, 1003);

const carbs =
getNutrient(food, 1005);

const fat =
getNutrient(food, 1004);

$("foodName").value =
food.description ||
food.lowercaseDescription ||
"Food";

setBaseNutrition({
calories,
protein,
carbs,
fat,
baseQuantity: 100,
baseUnit: "g"
});

$("suggestions").innerHTML = "";
}

/* -----------------------------
USDA SEARCH
----------------------------- */

async function searchUSDA(query) {
try {
const response =
await fetch(
`/api/foods?query=${encodeURIComponent(
          query
        )}`
);

```
if (!response.ok) {
  console.warn(
    "USDA unavailable:",
    response.status
  );

  return [];
}

const data =
  await response.json();

return Array.isArray(
  data.foods
)
  ? data.foods
  : [];
```

} catch (error) {
console.warn(
"USDA search unavailable:",
error
);

```
return [];
```

}
}

/* -----------------------------
LOCAL RESULTS
----------------------------- */

function showLocalResults(results) {
$("suggestions").innerHTML =
`<div style="padding:6px 10px;font-size:12px;opacity:.7;">
      Local foods     </div>` +
results
.map(
(food, index) =>
`<button data-local="${index}">
            ${esc(food.name)}           </button>`
)
.join("");

document
.querySelectorAll(
"#suggestions button[data-local]"
)
.forEach(button => {
button.onclick = () => {
fill(
results[
Number(
button.dataset.local
)
]
);
};
});
}

/* -----------------------------
USDA RESULTS
----------------------------- */

function showUSDAResults(results) {
if (!results.length) {
return;
}

$("suggestions").innerHTML =
`<div style="padding:6px 10px;font-size:12px;opacity:.7;">
      USDA results     </div>` +
results
.slice(0, 8)
.map(
(food, index) =>
`<button data-usda="${index}">
            ${esc(
              food.description ||
              "Food"
            )}           </button>`
)
.join("");

document
.querySelectorAll(
"#suggestions button[data-usda]"
)
.forEach(button => {
button.onclick = () => {
fillUSDA(
results[
Number(
button.dataset.usda
)
]
);
};
});
}

/* -----------------------------
FOOD SEARCH
----------------------------- */

$("foodName").oninput =
event => {
const query =
event.target.value
.trim()
.toLowerCase();

```
clearTimeout(usdaTimer);

selectedBaseNutrition =
  null;

if (!query) {
  $("suggestions").innerHTML =
    "";

  return;
}

/*
  LOCAL SEARCH FIRST
*/

const localResults =
  foods
    .filter(food =>
      String(
        food.name || ""
      )
        .toLowerCase()
        .includes(query)
    )
    .slice(0, 8);

if (localResults.length) {
  showLocalResults(
    localResults
  );
} else {
  $("suggestions").innerHTML = `
    <div style="padding:10px;font-size:13px;">
      Searching online foods...
    </div>
  `;
}

/*
  USDA SEARCH SECONDARY
*/

usdaTimer =
  setTimeout(
    async () => {
      const results =
        await searchUSDA(
          query
        );

      /*
        Only replace local results
        if USDA actually returned
        something.
      */

      if (
        results.length &&
        !localResults.length
      ) {
        showUSDAResults(
          results
        );
      }
    },
    500
  );
```

};

/* -----------------------------
QUANTITY CHANGE
----------------------------- */

$("quantityInput").oninput =
() => {
updateNutritionFromQuantity();
};

$("unitInput").onchange =
() => {
if (
!selectedBaseNutrition
) {
$("quantityNote").textContent =
"Select a food first.";

```
  return;
}

updateNutritionFromQuantity();
```

};

/* -----------------------------
ADD MEAL
----------------------------- */

$("addMeal").onclick =
() => {
const name =
$("foodName").value.trim();

```
if (!name) {
  alert(
    "Please enter a food name."
  );

  return;
}

const quantity =
  getQuantity();

const unit =
  $("unitInput").value ||
  "g";

state.meals.push({
  name,

  quantity,

  unit,

  calories:
    Number(
      $("caloriesInput")
        .value
    ) || 0,

  protein:
    Number(
      $("proteinInput")
        .value
    ) || 0,

  carbs:
    Number(
      $("carbsInput")
        .value
    ) || 0,

  fat:
    Number(
      $("fatInput")
        .value
    ) || 0,

  photo:
    window.pendingPhoto ||
    ""
});

window.pendingPhoto =
  "";

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

$("unitInput").value =
  "g";

$("quantityNote").textContent =
  "Select a food to calculate nutrition automatically.";

$("suggestions").innerHTML =
  "";

selectedBaseNutrition =
  null;

save();
render();
```

};

/* -----------------------------
PHOTO
----------------------------- */

$("photoBtn").onclick =
() => {
$("photoInput").click();
};

$("photoInput").onchange =
event => {
const file =
event.target.files[0];

```
if (!file) {
  return;
}

const reader =
  new FileReader();

reader.onload = () => {
  window.pendingPhoto =
    reader.result;

  alert(
    "Photo attached. Add the food details, then tap Add meal."
  );
};

reader.readAsDataURL(
  file
);
```

};

/* -----------------------------
WATER
----------------------------- */

$("waterBtn").onclick =
() => {
state.water =
Math.min(
GOALS.water,
state.water + 0.25
);

```
save();
render();
```

};

/* -----------------------------
RESET
----------------------------- */

$("resetDay").onclick =
() => {
if (
confirm(
"Reset today's meals and water?"
)
) {
state = {
meals: [],
water: 0
};

```
  save();
  render();
}
```

};

/* -----------------------------
START
----------------------------- */

loadFoods().then(() => {
render();
});

if (
"serviceWorker" in navigator
) {
window.addEventListener(
"load",
() => {
navigator.serviceWorker
.register(
"./service-worker.js"
)
.catch(() => {});
}
);
}
