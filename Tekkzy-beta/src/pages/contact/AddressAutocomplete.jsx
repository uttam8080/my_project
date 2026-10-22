import React, { useState, useEffect } from "react";

const AddressAutocomplete = ({ value, onChange, name = "address", error }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState(value || "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const token = "pk.4217ce33358c12aace0992e63d8791ca";

  useEffect(() => {
    if (query.length < 2) return setSuggestions([]);

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${token}&q=${encodeURIComponent(
            query
          )}&limit=5&countrycodes=in&normalizecity=1`
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error("LocationIQ Error:", err);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [query]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ target: { name, value: val } });
  };

  const handleSelect = (place) => {
    setQuery(place.display_name);
    onChange({ target: { name, value: place.display_name } });
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) =>
        prev === 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        name={name}
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
        placeholder="Enter your complete address..."
        className={`w-full bg-transparent border-b ${
          error ? "border-red-400/80" : "border-white/20"
        } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
        autoComplete="off"
      />
      {isFocused && suggestions.length > 0 && (
        <ul className="absolute z-20 bg-white text-black border border-gray-300 rounded mt-1 w-full max-h-60 overflow-y-auto shadow-lg">
          {suggestions.map((place, i) => (
            <li
              key={place.place_id}
              className={`p-2 cursor-pointer text-sm ${
                i === activeIndex ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onMouseDown={() => handleSelect(place)}>
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
