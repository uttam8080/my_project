import React from "react";
import { TEMPLATE_CATEGORY_OPTIONS } from "../../../utils/templateUtils";

export const CATEGORY_OTHER_VALUE = "__other__";

export function buildCategoryOptionList(existingCategories = [], extra = "") {
  return Array.from(
    new Set(
      [
        ...TEMPLATE_CATEGORY_OPTIONS,
        ...existingCategories.filter((category) => typeof category === "string" && category.trim()),
        extra,
      ].filter(Boolean),
    ),
  );
}

export function splitCategoryValue(category, options) {
  const normalized = String(category || "").trim();
  if (!normalized) {
    return { selected: "", custom: "" };
  }

  if (options.includes(normalized)) {
    return { selected: normalized, custom: "" };
  }

  return { selected: CATEGORY_OTHER_VALUE, custom: normalized };
}

export function mergeCategoryValue(selected, custom) {
  if (selected === CATEGORY_OTHER_VALUE) {
    return String(custom || "").trim();
  }

  return String(selected || "").trim();
}

const CategorySelect = ({
  selectedCategory,
  customCategory,
  onSelectedCategoryChange,
  onCustomCategoryChange,
  existingCategories = [],
  extraCategory = "",
  placeholder = "Select category...",
  optional = false,
  compact = false,
}) => {
  const categoryOptions = buildCategoryOptionList(existingCategories, extraCategory);
  const fieldClass = compact
    ? "w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
    : "w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-1.5"}>
      <label className={compact ? "text-xs font-semibold text-gray-300" : "text-sm font-semibold text-gray-300"}>
        Category{optional ? " (optional)" : ""}
      </label>
      <select
        value={selectedCategory}
        onChange={(event) => onSelectedCategoryChange(event.target.value)}
        className={fieldClass}
      >
        <option value="">{optional ? "Optional" : placeholder}</option>
        {categoryOptions.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value={CATEGORY_OTHER_VALUE}>Other...</option>
      </select>
      {selectedCategory === CATEGORY_OTHER_VALUE && (
        <input
          type="text"
          value={customCategory}
          onChange={(event) => onCustomCategoryChange(event.target.value)}
          placeholder="Type custom category"
          autoFocus
          className={`${fieldClass} border-blue-500/60 placeholder:text-gray-600`}
        />
      )}
    </div>
  );
};

export default CategorySelect;
