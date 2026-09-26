import { useEffect, useMemo, useState } from "react";
import {
  AdminCategory,
  AdminItem,
  INGREDIENT_UNITS,
  Ingredient,
  IngredientUnit,
  ItemRequirement,
  Recipe,
  RequirementLine,
  UNIT_LABELS,
  calculatePlan,
  calculateRequirement,
  createCategory,
  createIngredient,
  createItem,
  deleteCategory,
  deleteIngredient,
  deleteItem,
  fetchCategories,
  fetchIngredients,
  fetchItems,
  fetchRecipe,
  saveRecipe,
  updateCategory,
  updateIngredient,
  updateItem,
} from "../api/client";
import { BrandLogo } from "./BrandLogo";

interface OwnerPageProps {
  onExit: () => void;
}

interface DraftLine {
  key: string;
  ingredientName: string;
  quantity: string;
  unit: IngredientUnit;
  rate: string;
  notes: string;
}

type Tab = "recipes" | "planner" | "rates";

const WEIGHT: Partial<Record<IngredientUnit, number>> = { GRAM: 1, KG: 1000 };
const VOLUME: Partial<Record<IngredientUnit, number>> = { ML: 1, LITRE: 1000 };

function toBase(quantity: number, unit: IngredientUnit) {
  if (WEIGHT[unit]) return { amount: quantity * WEIGHT[unit]!, family: "WEIGHT" };
  if (VOLUME[unit]) return { amount: quantity * VOLUME[unit]!, family: "VOLUME" };
  return { amount: quantity, family: unit as string };
}

/// Cost of `quantity unit` when the ingredient is purchased at `rate` per `purchaseUnit`
function lineCost(
  quantity: number,
  unit: IngredientUnit,
  rate: number | null,
  purchaseUnit: IngredientUnit | undefined,
): number | null {
  if (rate === null || !Number.isFinite(rate) || !purchaseUnit) return null;
  const required = toBase(quantity, unit);
  const purchase = toBase(1, purchaseUnit);
  if (required.family !== purchase.family) return null;
  return Math.round((required.amount / purchase.amount) * rate * 100) / 100;
}

function emptyLine(): DraftLine {
  return {
    key: Math.random().toString(36).slice(2),
    ingredientName: "",
    quantity: "",
    unit: "KG",
    rate: "",
    notes: "",
  };
}

function formatQty(quantity: number, unit: IngredientUnit) {
  return `${Number(quantity.toFixed(3))} ${UNIT_LABELS[unit]}`;
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function errorMessage(err: unknown) {
  const response = (err as { response?: { data?: { error?: string } } })?.response;
  return response?.data?.error ?? "Something went wrong. Please try again.";
}

export function OwnerPage({ onExit }: OwnerPageProps) {
  const [tab, setTab] = useState<Tab>("recipes");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [itemId, setItemId] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([emptyLine()]);
  const [baseServings, setBaseServings] = useState("50");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState({ name: "", costPerPlate: "" });

  const [personCount, setPersonCount] = useState("500");
  const [requirement, setRequirement] = useState<ItemRequirement | null>(null);

  const [planItemIds, setPlanItemIds] = useState<string[]>([]);
  const [planPersonCount, setPlanPersonCount] = useState("500");
  const [planResult, setPlanResult] = useState<{
    perItem: ItemRequirement[];
    shoppingList: RequirementLine[];
    estimatedTotalCost: number | null;
  } | null>(null);

  const [newIngredient, setNewIngredient] = useState<{ name: string; unit: IngredientUnit; costPerUnit: string }>({
    name: "",
    unit: "KG",
    costPerUnit: "",
  });
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [rateSearch, setRateSearch] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );
  const selectedItem = useMemo(() => items.find((i) => i.id === itemId) ?? null, [items, itemId]);
  const ingredientByName = useMemo(
    () => new Map(ingredients.map((i) => [i.name.toLowerCase(), i])),
    [ingredients],
  );

  const recipeCost = useMemo(() => {
    let total = 0;
    let known = false;
    for (const line of draftLines) {
      const master = ingredientByName.get(line.ingredientName.trim().toLowerCase());
      const rate = line.rate !== "" ? Number(line.rate) : null;
      const cost = lineCost(Number(line.quantity) || 0, line.unit, rate, master?.unit ?? line.unit);
      if (cost !== null) {
        total += cost;
        known = true;
      }
    }
    return known ? Math.round(total * 100) / 100 : null;
  }, [draftLines, ingredientByName]);

  useEffect(() => {
    loadCategories();
    loadIngredients();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setItems([]);
      return;
    }
    fetchItems(categoryId)
      .then(setItems)
      .catch((err) => setError(errorMessage(err)));
  }, [categoryId]);

  useEffect(() => {
    setRequirement(null);
    if (!itemId) {
      setRecipe(null);
      return;
    }
    fetchRecipe(itemId)
      .then((data) => {
        setRecipe(data);
        setDraftLines(toDraft(data));
        setBaseServings(String(data.recipeBaseServings));
      })
      .catch((err) => setError(errorMessage(err)));
  }, [itemId, ingredients]);

  function toDraft(data: Recipe): DraftLine[] {
    if (data.lines.length === 0) return [emptyLine()];
    return data.lines.map((line) => {
      const master = ingredientByName.get(line.ingredientName.toLowerCase());
      return {
        key: line.id,
        ingredientName: line.ingredientName,
        quantity: String(line.quantity),
        unit: line.unit,
        rate: master?.costPerUnit ? String(Number(master.costPerUnit)) : "",
        notes: line.notes ?? "",
      };
    });
  }

  async function loadCategories() {
    try {
      setCategories(await fetchCategories());
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadIngredients() {
    try {
      setIngredients(await fetchIngredients());
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function notify(text: string) {
    setMessage(text);
    setError(null);
    window.setTimeout(() => setMessage(null), 2600);
  }

  // ---------- Categories ----------

  async function handleAddCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory({ name: newCategoryName.trim() });
      setNewCategoryName("");
      await loadCategories();
      setCategoryId(created.id);
      setItemId(null);
      notify("Category added");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSaveCategory(id: string) {
    if (!categoryDraft.trim()) return;
    try {
      await updateCategory(id, { name: categoryDraft.trim() });
      setEditingCategoryId(null);
      await loadCategories();
      notify("Category updated");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm("Delete this category? It must have no items.")) return;
    try {
      await deleteCategory(id);
      if (categoryId === id) {
        setCategoryId(null);
        setItemId(null);
      }
      await loadCategories();
      notify("Category deleted");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // ---------- Items ----------

  async function handleAddItem(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryId || !newItemName.trim()) return;
    try {
      const created = await createItem(categoryId, {
        name: newItemName.trim(),
        costPerPlate: Number(newItemCost || 0),
      });
      setNewItemName("");
      setNewItemCost("");
      setItems(await fetchItems(categoryId));
      setItemId(created.id);
      await loadCategories();
      notify("Item added");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSaveItem(id: string) {
    if (!itemDraft.name.trim()) return;
    try {
      await updateItem(id, {
        name: itemDraft.name.trim(),
        costPerPlate: Number(itemDraft.costPerPlate || 0),
      });
      setEditingItemId(null);
      if (categoryId) setItems(await fetchItems(categoryId));
      notify("Item updated");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDeleteItem(id: string) {
    if (!window.confirm("Delete this item and its ingredient recipe?")) return;
    try {
      await deleteItem(id);
      if (itemId === id) setItemId(null);
      if (categoryId) setItems(await fetchItems(categoryId));
      setPlanItemIds((ids) => ids.filter((planId) => planId !== id));
      await loadCategories();
      notify("Item deleted");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // ---------- Recipe ----------

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setDraftLines((lines) => lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function handleSaveRecipe(event: React.FormEvent) {
    event.preventDefault();
    if (!itemId) return;

    const usable = draftLines.filter((line) => line.ingredientName.trim() && Number(line.quantity) > 0);

    setSaving(true);
    try {
      const updated = await saveRecipe(itemId, {
        recipeBaseServings: Number(baseServings) || 50,
        lines: usable.map((line) => ({
          ingredientName: line.ingredientName.trim(),
          quantity: Number(line.quantity),
          unit: line.unit,
          notes: line.notes.trim() || null,
        })),
      });

      // Rates typed in the recipe grid are pushed back onto the ingredient master
      for (const line of updated.lines) {
        const draft = usable.find(
          (d) => d.ingredientName.trim().toLowerCase() === line.ingredientName.toLowerCase(),
        );
        if (!draft || draft.rate === "") continue;
        const master = ingredientByName.get(line.ingredientName.toLowerCase());
        if (master && Number(master.costPerUnit ?? NaN) === Number(draft.rate)) continue;
        await updateIngredient(line.ingredientId, { costPerUnit: Number(draft.rate) });
      }

      setRecipe(updated);
      setBaseServings(String(updated.recipeBaseServings));
      await loadIngredients();
      notify("Recipe and rates saved");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCalculate() {
    if (!itemId) return;
    try {
      setRequirement(await calculateRequirement(itemId, Number(personCount)));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handlePlan() {
    if (planItemIds.length === 0) {
      setError("Select at least one item for the contract.");
      return;
    }
    try {
      setPlanResult(
        await calculatePlan({
          personCount: Number(planPersonCount),
          items: planItemIds.map((id) => ({ itemId: id })),
        }),
      );
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // ---------- Ingredient rates ----------

  async function handleAddIngredient(event: React.FormEvent) {
    event.preventDefault();
    if (!newIngredient.name.trim()) return;
    try {
      await createIngredient({
        name: newIngredient.name.trim(),
        unit: newIngredient.unit,
        costPerUnit: newIngredient.costPerUnit === "" ? null : Number(newIngredient.costPerUnit),
      });
      setNewIngredient({ name: "", unit: "KG", costPerUnit: "" });
      await loadIngredients();
      notify("Ingredient added");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSaveRate(ingredient: Ingredient, unit: IngredientUnit) {
    const draft = rateDrafts[ingredient.id];
    const costPerUnit =
      draft === undefined
        ? ingredient.costPerUnit === null
          ? null
          : Number(ingredient.costPerUnit)
        : draft === ""
          ? null
          : Number(draft);
    try {
      await updateIngredient(ingredient.id, { unit, costPerUnit });
      setRateDrafts((drafts) => {
        const next = { ...drafts };
        delete next[ingredient.id];
        return next;
      });
      await loadIngredients();
      notify(`${ingredient.name} updated`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDeleteIngredient(ingredient: Ingredient) {
    if (!window.confirm(`Delete "${ingredient.name}" from the ingredient master?`)) return;
    try {
      await deleteIngredient(ingredient.id);
      await loadIngredients();
      notify("Ingredient deleted");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const visibleIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(rateSearch.trim().toLowerCase()),
  );

  return (
    <div className="owner-page">
      <header className="owner-topbar">
        <div className="owner-brand">
          <BrandLogo />
          <span className="owner-badge">Owner Console</span>
        </div>
        <nav className="owner-tabs">
          <button className={tab === "recipes" ? "owner-tab active" : "owner-tab"} onClick={() => setTab("recipes")}>
            Menu &amp; Recipes
          </button>
          <button className={tab === "planner" ? "owner-tab active" : "owner-tab"} onClick={() => setTab("planner")}>
            Contract Planner
          </button>
          <button className={tab === "rates" ? "owner-tab active" : "owner-tab"} onClick={() => setTab("rates")}>
            Ingredient Rates
          </button>
        </nav>
        <button className="btn btn-outline" onClick={onExit}>
          Back to site
        </button>
      </header>

      <div className="owner-statbar">
        <span>
          <strong>{categories.length}</strong> categories
        </span>
        <span>
          <strong>{categories.reduce((sum, c) => sum + (c._count?.items ?? 0), 0)}</strong> menu items
        </span>
        <span>
          <strong>{ingredients.length}</strong> ingredients
        </span>
        <span>
          <strong>{ingredients.filter((i) => i.costPerUnit !== null).length}</strong> priced
        </span>
      </div>

      {(error || message) && (
        <div className={error ? "owner-alert owner-alert-error" : "owner-alert owner-alert-ok"}>
          <span>{error || message}</span>
          <button className="owner-icon-btn" onClick={() => (error ? setError(null) : setMessage(null))}>
            ×
          </button>
        </div>
      )}

      {tab === "recipes" && (
        <main className="owner-grid">
          <section className="owner-panel">
            <div className="owner-panel-head">
              <span className="owner-step">1</span>
              <h3>Categories</h3>
            </div>
            <form className="owner-inline-form" onSubmit={handleAddCategory}>
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Pizza"
                aria-label="New category name"
              />
              <button className="btn btn-primary" type="submit">
                Add
              </button>
            </form>
            <ul className="owner-list">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={category.id === categoryId ? "owner-list-row selected" : "owner-list-row"}
                >
                  {editingCategoryId === category.id ? (
                    <div className="owner-edit-row">
                      <input
                        value={categoryDraft}
                        onChange={(e) => setCategoryDraft(e.target.value)}
                        aria-label="Category name"
                        autoFocus
                      />
                      <button className="owner-icon-btn ok" title="Save" onClick={() => handleSaveCategory(category.id)}>
                        ✓
                      </button>
                      <button className="owner-icon-btn" title="Cancel" onClick={() => setEditingCategoryId(null)}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="owner-list-main"
                        onClick={() => {
                          setCategoryId(category.id);
                          setItemId(null);
                        }}
                      >
                        <span>{category.name}</span>
                        <small>{category._count?.items ?? 0} items</small>
                      </button>
                      <button
                        className="owner-icon-btn"
                        title="Rename category"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setCategoryDraft(category.name);
                        }}
                      >
                        ✎
                      </button>
                      <button
                        className="owner-icon-btn"
                        title="Delete category"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        ×
                      </button>
                    </>
                  )}
                </li>
              ))}
              {categories.length === 0 && <p className="owner-empty">No categories yet. Add one above.</p>}
            </ul>
          </section>

          <section className="owner-panel">
            <div className="owner-panel-head">
              <span className="owner-step">2</span>
              <h3>Items{selectedCategory ? ` · ${selectedCategory.name}` : ""}</h3>
            </div>
            {selectedCategory ? (
              <>
                <form className="owner-inline-form" onSubmit={handleAddItem}>
                  <input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Margherita Pizza"
                    aria-label="New item name"
                  />
                  <input
                    className="owner-narrow"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    placeholder="₹/plate"
                    type="number"
                    min="0"
                    aria-label="Cost per plate"
                  />
                  <button className="btn btn-primary" type="submit">
                    Add
                  </button>
                </form>
                <ul className="owner-list">
                  {items.map((item) => (
                    <li key={item.id} className={item.id === itemId ? "owner-list-row selected" : "owner-list-row"}>
                      {editingItemId === item.id ? (
                        <div className="owner-edit-row">
                          <input
                            value={itemDraft.name}
                            onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
                            aria-label="Item name"
                            autoFocus
                          />
                          <input
                            className="owner-narrow"
                            type="number"
                            min="0"
                            value={itemDraft.costPerPlate}
                            onChange={(e) => setItemDraft({ ...itemDraft, costPerPlate: e.target.value })}
                            aria-label="Cost per plate"
                          />
                          <button className="owner-icon-btn ok" title="Save" onClick={() => handleSaveItem(item.id)}>
                            ✓
                          </button>
                          <button className="owner-icon-btn" title="Cancel" onClick={() => setEditingItemId(null)}>
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <button className="owner-list-main" onClick={() => setItemId(item.id)}>
                            <span>{item.name}</span>
                            <small>{money(Number(item.costPerPlate))} / plate</small>
                          </button>
                          <button
                            className="owner-icon-btn"
                            title="Edit name & price"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setItemDraft({ name: item.name, costPerPlate: String(Number(item.costPerPlate)) });
                            }}
                          >
                            ✎
                          </button>
                          <button
                            className="owner-icon-btn"
                            title="Delete item"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            ×
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                  {items.length === 0 && <p className="owner-empty">No items in this category yet.</p>}
                </ul>
              </>
            ) : (
              <p className="owner-empty">Pick a category on the left to manage its items.</p>
            )}
          </section>

          <section className="owner-panel owner-panel-wide">
            <div className="owner-panel-head">
              <span className="owner-step">3</span>
              <h3>Ingredients{selectedItem ? ` · ${selectedItem.name}` : ""}</h3>
              {selectedItem && recipeCost !== null && (
                <span className="owner-pill">
                  Raw cost for {baseServings} persons: {money(recipeCost)}
                </span>
              )}
            </div>

            {selectedItem && recipe ? (
              <>
                <form onSubmit={handleSaveRecipe}>
                  <label className="owner-field">
                    <span>Recipe is written for</span>
                    <input
                      className="owner-narrow"
                      type="number"
                      min="1"
                      value={baseServings}
                      onChange={(e) => setBaseServings(e.target.value)}
                    />
                    <span>persons</span>
                  </label>

                  <datalist id="owner-ingredient-options">
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.name} />
                    ))}
                  </datalist>

                  <div className="owner-table-scroll">
                    <table className="owner-table">
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th className="owner-col-qty">Quantity</th>
                          <th className="owner-col-unit">Unit</th>
                          <th className="owner-col-rate">Rate</th>
                          <th className="owner-col-cost">Line cost</th>
                          <th>Note</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {draftLines.map((line) => {
                          const master = ingredientByName.get(line.ingredientName.trim().toLowerCase());
                          const purchaseUnit = master?.unit ?? line.unit;
                          const rate = line.rate !== "" ? Number(line.rate) : null;
                          const cost = lineCost(Number(line.quantity) || 0, line.unit, rate, purchaseUnit);
                          return (
                            <tr key={line.key}>
                              <td>
                                <input
                                  list="owner-ingredient-options"
                                  value={line.ingredientName}
                                  onChange={(e) => {
                                    const name = e.target.value;
                                    const found = ingredientByName.get(name.trim().toLowerCase());
                                    updateLine(line.key, {
                                      ingredientName: name,
                                      ...(found?.costPerUnit ? { rate: String(Number(found.costPerUnit)) } : {}),
                                    });
                                  }}
                                  placeholder="e.g. Maida"
                                  aria-label="Ingredient name"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={line.quantity}
                                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                                  placeholder="2"
                                  aria-label="Quantity"
                                />
                              </td>
                              <td>
                                <select
                                  value={line.unit}
                                  onChange={(e) => updateLine(line.key, { unit: e.target.value as IngredientUnit })}
                                  aria-label="Unit"
                                >
                                  {INGREDIENT_UNITS.map((unit) => (
                                    <option key={unit} value={unit}>
                                      {UNIT_LABELS[unit]}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <div className="owner-rate-cell">
                                  <span className="owner-rupee">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={line.rate}
                                    onChange={(e) => updateLine(line.key, { rate: e.target.value })}
                                    placeholder="0"
                                    aria-label="Purchase rate"
                                  />
                                  <small>/{UNIT_LABELS[purchaseUnit]}</small>
                                </div>
                              </td>
                              <td className="owner-cost-cell">{money(cost)}</td>
                              <td>
                                <input
                                  value={line.notes}
                                  onChange={(e) => updateLine(line.key, { notes: e.target.value })}
                                  placeholder="optional"
                                  aria-label="Note"
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="owner-icon-btn"
                                  title="Remove ingredient"
                                  onClick={() =>
                                    setDraftLines((lines) =>
                                      lines.length === 1 ? [emptyLine()] : lines.filter((l) => l.key !== line.key),
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="owner-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setDraftLines((lines) => [...lines, emptyLine()])}
                    >
                      + Add ingredient
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? "Saving…" : "Save recipe & rates"}
                    </button>
                    <span className="owner-hint">Rates typed here also update the ingredient master.</span>
                  </div>
                </form>

                <div className="owner-divider" />

                <h4>Requirement calculator</h4>
                <div className="owner-actions">
                  <label className="owner-field">
                    <span>Cooking for</span>
                    <input
                      className="owner-narrow"
                      type="number"
                      min="1"
                      value={personCount}
                      onChange={(e) => setPersonCount(e.target.value)}
                    />
                    <span>persons</span>
                  </label>
                  {[100, 250, 500, 1000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={personCount === String(count) ? "owner-chip active" : "owner-chip"}
                      onClick={() => setPersonCount(String(count))}
                    >
                      {count}
                    </button>
                  ))}
                  <button type="button" className="btn btn-gold" onClick={handleCalculate}>
                    Calculate
                  </button>
                </div>

                {requirement && (
                  <div className="owner-result">
                    <p className="owner-result-title">
                      {requirement.itemName} · {requirement.personCount} persons
                    </p>
                    <table className="owner-table owner-table-read">
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th>Required</th>
                          <th>Est. cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requirement.lines.map((line) => (
                          <tr key={line.ingredientId}>
                            <td>{line.ingredientName}</td>
                            <td>
                              <strong>{formatQty(line.quantity, line.unit)}</strong>
                            </td>
                            <td>{money(line.estimatedCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {requirement.estimatedTotalCost !== null && (
                      <p className="owner-total">
                        Estimated raw material cost: {money(requirement.estimatedTotalCost)} ·{" "}
                        {money(requirement.estimatedTotalCost / requirement.personCount)} per plate
                      </p>
                    )}
                    <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                      Print list
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="owner-empty">Pick an item to add its ingredients.</p>
            )}
          </section>
        </main>
      )}

      {tab === "planner" && (
        <main className="owner-planner">
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h3>Items in this contract</h3>
            </div>
            <div className="owner-chip-row">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={category.id === categoryId ? "owner-chip active" : "owner-chip"}
                  onClick={() => setCategoryId(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <ul className="owner-list">
              {items.map((item) => (
                <li key={item.id} className="owner-list-row">
                  <label className="owner-check">
                    <input
                      type="checkbox"
                      checked={planItemIds.includes(item.id)}
                      onChange={(e) =>
                        setPlanItemIds((ids) =>
                          e.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id),
                        )
                      }
                    />
                    <span>{item.name}</span>
                    <small>{money(Number(item.costPerPlate))} / plate</small>
                  </label>
                </li>
              ))}
              {items.length === 0 && <p className="owner-empty">Pick a category above to list its items.</p>}
            </ul>
            <div className="owner-actions">
              <label className="owner-field">
                <span>For</span>
                <input
                  className="owner-narrow"
                  type="number"
                  min="1"
                  value={planPersonCount}
                  onChange={(e) => setPlanPersonCount(e.target.value)}
                />
                <span>persons</span>
              </label>
              <button className="btn btn-primary" onClick={handlePlan}>
                Build shopping list
              </button>
            </div>
            {planItemIds.length > 0 && (
              <p className="owner-hint">
                {planItemIds.length} item(s) selected ·{" "}
                <button className="owner-linkish" onClick={() => setPlanItemIds([])}>
                  clear
                </button>
              </p>
            )}
          </section>

          <section className="owner-panel owner-panel-wide">
            <div className="owner-panel-head">
              <h3>Consolidated shopping list</h3>
              {planResult && planResult.estimatedTotalCost !== null && (
                <span className="owner-pill">Total {money(planResult.estimatedTotalCost)}</span>
              )}
            </div>
            {planResult ? (
              <>
                <table className="owner-table owner-table-read">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Total required</th>
                      <th>Est. cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planResult.shoppingList.map((line) => (
                      <tr key={line.ingredientId}>
                        <td>{line.ingredientName}</td>
                        <td>
                          <strong>{formatQty(line.quantity, line.unit)}</strong>
                        </td>
                        <td>{money(line.estimatedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="owner-divider" />
                <h4>Break-up per item</h4>
                <div className="owner-breakup-grid">
                  {planResult.perItem.map((item) => (
                    <div key={item.itemId} className="owner-result">
                      <p className="owner-result-title">
                        {item.itemName} · {item.personCount} persons
                      </p>
                      <ul className="owner-breakup">
                        {item.lines.map((line) => (
                          <li key={line.ingredientId}>
                            {line.ingredientName} — <strong>{formatQty(line.quantity, line.unit)}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline" onClick={() => window.print()}>
                  Print list
                </button>
              </>
            ) : (
              <p className="owner-empty">Choose items and a guest count to generate the list.</p>
            )}
          </section>
        </main>
      )}

      {tab === "rates" && (
        <main className="owner-rates">
          <section className="owner-panel owner-panel-wide">
            <div className="owner-panel-head">
              <h3>Ingredient master &amp; purchase rates</h3>
              <input
                className="owner-search"
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                placeholder="Search ingredient…"
                aria-label="Search ingredients"
              />
            </div>

            <form className="owner-inline-form" onSubmit={handleAddIngredient}>
              <input
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                placeholder="New ingredient, e.g. Cheese"
                aria-label="New ingredient name"
              />
              <select
                className="owner-narrow"
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value as IngredientUnit })}
                aria-label="Purchase unit"
              >
                {INGREDIENT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {UNIT_LABELS[unit]}
                  </option>
                ))}
              </select>
              <input
                className="owner-narrow"
                type="number"
                min="0"
                step="0.01"
                value={newIngredient.costPerUnit}
                onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: e.target.value })}
                placeholder="₹ rate"
                aria-label="Rate per unit"
              />
              <button className="btn btn-primary" type="submit">
                Add
              </button>
            </form>

            <div className="owner-table-scroll">
              <table className="owner-table owner-table-read">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th className="owner-col-unit">Purchase unit</th>
                    <th className="owner-col-rate">Rate (₹ per unit)</th>
                    <th className="owner-col-actions" />
                  </tr>
                </thead>
                <tbody>
                  {visibleIngredients.map((ingredient) => {
                    const draft = rateDrafts[ingredient.id];
                    const value = draft ?? (ingredient.costPerUnit ? String(Number(ingredient.costPerUnit)) : "");
                    return (
                      <tr key={ingredient.id}>
                        <td>{ingredient.name}</td>
                        <td>
                          <select
                            value={ingredient.unit}
                            onChange={(e) => handleSaveRate(ingredient, e.target.value as IngredientUnit)}
                            aria-label={`Unit for ${ingredient.name}`}
                          >
                            {INGREDIENT_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {UNIT_LABELS[unit]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={value}
                            onChange={(e) => setRateDrafts({ ...rateDrafts, [ingredient.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRate(ingredient, ingredient.unit);
                            }}
                            placeholder="not set"
                            aria-label={`Rate for ${ingredient.name}`}
                          />
                        </td>
                        <td className="owner-row-actions">
                          <button
                            className="btn btn-outline btn-small"
                            disabled={draft === undefined}
                            onClick={() => handleSaveRate(ingredient, ingredient.unit)}
                          >
                            Save
                          </button>
                          <button
                            className="owner-icon-btn"
                            title="Delete ingredient"
                            onClick={() => handleDeleteIngredient(ingredient)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visibleIngredients.length === 0 && <p className="owner-empty">No ingredients match your search.</p>}
          </section>
        </main>
      )}
    </div>
  );
}
