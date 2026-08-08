const GOALS = {
calories: 1700,
protein: 100,
carbs: 180,
fat: 55,
water: 3
};

const KEY = "foodtracker_v2";

let state = JSON.parse(
localStorage.getItem(KEY) ||
'{"meals":[],"water":0}'
);

let foods = [];
let usdaTimer = null;

let selectedBaseNutrition = null;

const $ = id =>
document.getElementById(id);

/* =========================================
STORAGE
========================================= */

function save() {
localStorage.setItem(
KEY,
JSON.stringify(state)
);
}

/* =========================================
TOTALS
========================================= */

function totals() {

return state.meals.reduce(
(total, meal) => {

```
  total.calories +=
    Number(meal.calories) || 0;

  total.protein +=
    Number(meal.protein) || 0;

  total.carbs +=
    Number(meal.carbs) || 0;

  total.fat +=
    Number(meal.fat) || 0;

  return total;

},
{
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
}
```

);
}

/* =========================================
HTML ESCAPE
========================================= */

function esc(value) {

return String(value).replace(
/[&<>"']/g,
character => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
})[character]
);
}

/* =========================================
RENDER DASHBOARD
========================================= */

function render() {

const total = totals();

const percentage = Math.min(
100,
(total.calories / GOALS.calories) * 100
);

$("calories").textContent =
Math.round(total.calories);

$("protein").textContent =
Math.round(total.protein);

$("carbs").textContent =
Math.round(total.carbs);

$("fat").textContent =
Math.round(total.fat);

$("water").textContent =
Number(state.water).toFixed(1);

$("calBar").style.width =
percentage + "%";

$("calRing").style.setProperty(
"--deg",
percentage * 3.6 + "deg"
);

$("calPct").textContent =
Math.round(percentage) + "%";

$("mealSummary").textContent =
state.meals.length
? `${state.meals.length} meal${
          state.meals.length === 1
            ? ""
            : "s"
        } • ${Math.round(
          total.calories
        )} kcal`
: "Nothing logged yet";

/* MEAL LIST */

$("mealList").innerHTML =
state.meals
.map(
(meal, index) => `

```
      <div class="meal">

        ${
          meal.photo
            ? `
              <img
                src="${meal.photo}"
                alt=""
                style="
                  width:50px;
                  height:50px;
                  object-fit:cover;
                  border-radius:10px;
                "
              >
            `
            : ""
        }

        <div class="meal-main">

          <strong>
            ${esc(meal.name)}
          </strong>

          ${
            meal.quantity
              ? `
                <small>
                  ${meal.quantity}
                  ${esc(
                    meal.unit || "g"
                  )}
                </small>
              `
              : ""
          }

          <div class="meal-macros">

            ${Math.round(
              meal.protein
            )}g protein •

            ${Math.round(
              meal.carbs
            )}g carbs •

            ${Math.round(
              meal.fat
            )}g fat

          </div>

        </div>


        <div class="meal-kcal">

          ${Math.round(
            meal.calories
          )}

          <small>
            kcal
          </small>

        </div>


        <button
          class="delete"
          data-i="${index}"
          type="button"
        >
          ×
        </button>

      </div>
    `
  )
  .join("");
```

/* DELETE BUTTONS */

document
.querySelectorAll(".delete")
.forEach(button => {

```
  button.onclick = () => {

    state.meals.splice(
      Number(button.dataset.i),
      1
    );

    save();
    render();
  };

});
```

$("adviceText").innerHTML =
advice(total);

/* SCORE */

$("score").textContent =
state.meals.length
? Math.max(
5,
Math.min(
10,
5 +
(total.protein /
GOALS.protein) *
3 +
(
total.calories <=
GOALS.calories
? 2
: 0
)
)
).toFixed(1) + "/10"
: "—";
}

/* =========================================
COACH
========================================= */

function advice(total) {

if (!state.meals.length) {

```
return (
  "Add your first meal and I'll give you a simple nutrition check."
);
```

}

const caloriesLeft =
Math.round(
GOALS.calories -
total.calories
);

const proteinLeft =
Math.round(
GOALS.protein -
total.protein
);

if (
total.calories >
GOALS.calories
) {

```
return `
  You've passed your
  <b>${GOALS.calories} kcal</b>
  target by
  ${Math.round(
    total.calories -
    GOALS.calories
  )}
  kcal.
  Keep the rest of today
  light and protein-focused.
`;
```

}

if (proteinLeft > 0) {

```
return `
  You have about
  <b>${Math.max(
    0,
    caloriesLeft
  )} kcal</b>
  and
  <b>${proteinLeft}g protein</b>
  left.
  A protein-rich meal would
  be a good next choice.
`;
```

}

return `
Nice work — you're at <b>${Math.round(
total.protein
)}g protein</b>.

```
You have about
<b>${Math.max(
  0,
  caloriesLeft
)} kcal</b>
remaining today.
```

`;
}

/* =========================================
LOAD LOCAL FOODS
========================================= */

async function loadFoods() {

try {

```
const response =
  await fetch(
    "./foods.json?version=2",
    {
      cache: "no-store"
    }
  );


if (!response.ok) {

  throw new Error(
    `foods.json returned ${response.status}`
  );
}


const data =
  await response.json();


if (!Array.isArray(data)) {

  throw new Error(
    "foods.json is not an array"
  );
}


foods = data;


console.log(
  "Food database loaded:",
  foods.length,
  "foods"
);
```

} catch (error) {

```
console.error(
  "Could not load foods.json:",
  error
);

foods = [];
```

}
}

/* =========================================
QUANTITY
========================================= */

function getQuantity() {

return Number(
$("quantityInput").value
) || 0;
}

function setBaseNutrition(data) {

selectedBaseNutrition = {

```
calories:
  Number(data.calories) || 0,

protein:
  Number(data.protein) || 0,

carbs:
  Number(data.carbs) || 0,

fat:
  Number(data.fat) || 0,

baseQuantity:
  Number(data.baseQuantity) || 100,

baseUnit:
  data.baseUnit || "g"
```

};

$("unitInput").value =
selectedBaseNutrition.baseUnit;

$("quantityInput").value =
selectedBaseNutrition.baseQuantity;

updateNutritionFromQuantity();
}

function updateNutritionFromQuantity() {

if (
!selectedBaseNutrition
) {

```
return;
```

}

const quantity =
getQuantity();

if (quantity <= 0) {

```
return;
```

}

const baseQuantity =
selectedBaseNutrition.baseQuantity;

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

/* =========================================
SELECT LOCAL FOOD
========================================= */

function fill(food) {

$("foodName").value =
food.name;

setBaseNutrition({

```
calories:
  food.calories,

protein:
  food.protein,

carbs:
  food.carbs,

fat:
  food.fat,

baseQuantity:
  food.baseQuantity || 100,

baseUnit:
  food.baseUnit || "g"
```

});

$("suggestions").innerHTML =
"";
}

/* =========================================
USDA NUTRIENTS
========================================= */

function getNutrient(
food,
nutrientId
) {

const nutrient =
Array.isArray(
food.foodNutrients
)
? food.foodNutrients.find(
item =>
Number(
item.nutrientId
) === nutrientId
)
: null;

return nutrient
? Number(
nutrient.value || 0
)
: 0;
}

/* =========================================
SELECT USDA FOOD
========================================= */

function fillUSDA(food) {

$("foodName").value =
food.description ||
food.lowercaseDescription ||
"Food";

setBaseNutrition({

```
calories:
  getNutrient(
    food,
    1008
  ),

protein:
  getNutrient(
    food,
    1003
  ),

carbs:
  getNutrient(
    food,
    1005
  ),

fat:
  getNutrient(
    food,
    1004
  ),

baseQuantity: 100,

baseUnit: "g"
```

});

$("suggestions").innerHTML =
"";
}

/* =========================================
USDA SEARCH
========================================= */

async function searchUSDA(
query
) {

try {

```
const response =
  await fetch(
    `/api/foods?query=${encodeURIComponent(
      query
    )}`
  );


if (!response.ok) {

  console.warn(
    "USDA API unavailable:",
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

```
console.warn(
  "USDA search failed:",
  error
);

return [];
```

}
}

/* =========================================
SHOW LOCAL RESULTS
========================================= */

function showLocalResults(
results
) {

$("suggestions").innerHTML = `

```
<div
  style="
    padding:6px 10px;
    font-size:12px;
    opacity:.7;
  "
>
  Local foods
</div>

${results
  .map(
    (food, index) => `

      <button
        type="button"
        data-local="${index}"
      >
        ${esc(food.name)}
      </button>

    `
  )
  .join("")}
```

`;

document
.querySelectorAll(
"#suggestions [data-local]"
)
.forEach(button => {

```
  button.onclick =
    () => {

      fill(
        results[
          Number(
            button.dataset.local
          )
        ]
      );

    };

});
```

}

/* =========================================
SHOW USDA RESULTS
========================================= */

function showUSDAResults(
results
) {

if (!results.length) {
return;
}

$("suggestions").innerHTML = `

```
<div
  style="
    padding:6px 10px;
    font-size:12px;
    opacity:.7;
  "
>
  USDA results
</div>

${results
  .slice(0, 8)
  .map(
    (food, index) => `

      <button
        type="button"
        data-usda="${index}"
      >
        ${esc(
          food.description ||
          "Food"
        )}
      </button>

    `
  )
  .join("")}
```

`;

document
.querySelectorAll(
"#suggestions [data-usda]"
)
.forEach(button => {

```
  button.onclick =
    () => {

      fillUSDA(
        results[
          Number(
            button.dataset.usda
          )
        ]
      );

    };

});
```

}

/* =========================================
FOOD SEARCH
========================================= */

$("foodName").oninput =
event => {

```
const query =
  event.target.value
    .trim()
    .toLowerCase();


clearTimeout(
  usdaTimer
);


selectedBaseNutrition =
  null;


if (!query) {

  $("suggestions").innerHTML =
    "";

  return;
}


/* LOCAL DATABASE FIRST */

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


if (
  localResults.length
) {

  showLocalResults(
    localResults
  );

} else {

  $("suggestions").innerHTML = `

    <div
      style="
        padding:10px;
        font-size:13px;
      "
    >
      Searching online foods...
    </div>

  `;
}


/* USDA AS SECONDARY SOURCE */

usdaTimer =
  setTimeout(
    async () => {

      const results =
        await searchUSDA(
          query
        );


      /*
         IMPORTANT:

         Don't replace local
         results with USDA results.

         Local foods remain visible
         even when USDA responds.
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

/* =========================================
QUANTITY INPUT
========================================= */

$("quantityInput").oninput =
() => {

```
updateNutritionFromQuantity();
```

};

$("unitInput").onchange =
() => {

```
if (
  !selectedBaseNutrition
) {

  $("quantityNote").textContent =
    "Select a food first.";

  return;
}


updateNutritionFromQuantity();
```

};

/* =========================================
ADD MEAL
========================================= */

$("addMeal").onclick =
() => {

```
const name =
  $("foodName")
    .value
    .trim();


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


const meal = {

  name,

  quantity,

  unit,

  calories:
    Number(
      $("caloriesInput").value
    ) || 0,

  protein:
    Number(
      $("proteinInput").value
    ) || 0,

  carbs:
    Number(
      $("carbsInput").value
    ) || 0,

  fat:
    Number(
      $("fatInput").value
    ) || 0,

  photo:
    window.pendingPhoto ||
    ""

};


state.meals.push(
  meal
);


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

/* =========================================
PHOTO
========================================= */

$("photoBtn").onclick =
() => {

```
$("photoInput").click();
```

};

$("photoInput").onchange =
event => {

```
const file =
  event.target.files[0];


if (!file) {
  return;
}


const reader =
  new FileReader();


reader.onload =
  () => {

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

/* =========================================
WATER
========================================= */

$("waterBtn").onclick =
() => {

```
state.water =
  Math.min(
    GOALS.water,
    Number(state.water) +
      0.25
  );


save();
render();
```

};

/* =========================================
RESET
========================================= */

$("resetDay").onclick =
() => {

```
if (
  confirm(
    "Reset today's meals and water?"
  )
) {

  state = {
    meals: [],
    water: 0
  };


  save();
  render();
}
```

};

/* =========================================
START APP
========================================= */

async function startApp() {

await loadFoods();

render();

}

startApp();

/* =========================================
SERVICE WORKER
========================================= */

if (
"serviceWorker" in navigator
) {

window.addEventListener(
"load",
() => {

```
  navigator.serviceWorker
    .register(
      "./service-worker.js"
    )
    .catch(
      error =>
        console.warn(
          "Service worker registration failed:",
          error
        )
    );

}
```

);
}
