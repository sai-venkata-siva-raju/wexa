export const toNumber = (value) => {
  if (typeof value === "number") return value;

  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  if (value && typeof value === "object" && "low" in value && "high" in value) {
    return Number(value.low) + Number(value.high) * 4294967296;
  }

  return Number(value) || 0;
};

export const normalizeNeo4jValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeNeo4jValue);
  }

  if (value && typeof value === "object") {
    if ("low" in value && "high" in value) {
      return toNumber(value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        normalizeNeo4jValue(nestedValue),
      ])
    );
  }

  return value;
};
