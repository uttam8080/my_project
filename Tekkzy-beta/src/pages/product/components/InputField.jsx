import React, { useState, useEffect } from "react";

const Label = ({ label, dark }) => (
  <div
    className={`text-[11px] font-medium tracking-wide mb-1.5 ${
      dark ? "text-white/40" : "text-gray-500"
    }`}
  >
    {label}
  </div>
);

const Wrapper = ({ children, dark }) => (
  <div
    className={
      dark
        ? ""
        : "mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition"
    }
  >
    {children}
  </div>
);

const inputClass = (dark) =>
  dark
    ? "w-full text-[14px] text-white bg-[#141414] border border-white/[0.12] rounded-lg px-3.5 py-3 placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 transition-colors"
    : "w-full text-gray-800 bg-gray-50 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400";

const InputField = ({ label, value, onChange, type = "text", variant = "light", onFocusField }) => {
  const dark = variant === "dark";
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const emitFocus = (nextValue) => {
    if (typeof onFocusField !== "function") return;
    // Prefer the live local value so highlight tracks typing, not the stale prop.
    const resolved =
      nextValue !== undefined ? nextValue : localValue !== undefined && localValue !== ""
        ? localValue
        : value;
    onFocusField(resolved);
  };

  if (type === "boolean") {
    return (
      <Wrapper dark={dark}>
        <label
          className="flex items-center justify-between gap-3"
          onClick={() => emitFocus(value)}
        >
          <span className={`text-sm font-medium ${dark ? "text-white/70" : "text-gray-700"}`}>
            {label}
          </span>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            onFocus={() => emitFocus(value)}
            className="w-4 h-4"
          />
        </label>
      </Wrapper>
    );
  }

  if (type === "textarea") {
    return (
      <Wrapper dark={dark}>
        <Label label={label} dark={dark} />
        <textarea
          value={localValue}
          onChange={(e) => {
            const next = e.target.value;
            setLocalValue(next);
            onChange(next);
            emitFocus(next);
          }}
          onFocus={() => emitFocus()}
          rows={4}
          className={`${inputClass(dark)} resize-y min-h-[96px] leading-relaxed`}
        />
      </Wrapper>
    );
  }

  if (type === "color") {
    const toPickerValue = (raw) => {
      const s = String(raw || "").trim();
      const m = s.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
      if (!m) return "#ffffff";
      let hex = m[1];
      if (hex.length === 3) {
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
      }
      return `#${hex.toLowerCase()}`;
    };
    const pickerValue = toPickerValue(value);

    return (
      <Wrapper dark={dark}>
        <Label label={label} dark={dark} />
        <div className="flex items-center gap-3" onClick={() => emitFocus(value)}>
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => emitFocus(value)}
            className="w-9 h-9 border border-white/10 rounded cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={localValue}
            onChange={(e) => {
              const next = e.target.value;
              setLocalValue(next);
              onChange(next);
              emitFocus(next);
            }}
            onFocus={() => emitFocus()}
            spellCheck={false}
            className={`${inputClass(dark)} font-mono max-w-[8rem]`}
          />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper dark={dark}>
      <Label label={label} dark={dark} />
      <input
        type={type === "number" ? "number" : "text"}
        value={localValue}
        onChange={(e) => {
          let val = e.target.value;
          if (type === "number") val = Number(val);
          setLocalValue(val);
          onChange(val);
          emitFocus(val);
        }}
        onFocus={() => emitFocus()}
        className={inputClass(dark)}
      />
    </Wrapper>
  );
};

export default InputField;
