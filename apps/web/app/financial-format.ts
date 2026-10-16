import type { DecimalValue } from "@hazine-ajani/report-schema";

export function exactPercentLabel(value: DecimalValue): string {
  const negative = value.value.startsWith("-");
  const unsigned = negative ? value.value.slice(1) : value.value;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const scaled = BigInt(`${whole}${fraction.padEnd(value.scale, "0")}`) * 100n;
  const digits = scaled.toString().padStart(value.scale + 1, "0");
  const integer = value.scale === 0 ? digits : digits.slice(0, -value.scale);
  const decimals = value.scale === 0 ? "" : `.${digits.slice(-value.scale)}`;
  return `Tam değer yüzde ${negative ? "-" : ""}${integer}${decimals}`;
}
