import { Currency, Direction } from "./types";

export const CURRENCY_SCALE: Record<Currency, number> = {
  XOF: 0,
  NGN: 2,
};

const SCALE_DIVISOR: Record<Currency, bigint> = {
  XOF: 1n,
  NGN: 100n,
};

export function directionCurrencies(direction: Direction) {
  return direction === "XOF_NGN"
    ? ({ source: "XOF", target: "NGN" } as const)
    : ({ source: "NGN", target: "XOF" } as const);
}

export function parseAmountToMinor(value: number | string, currency: Currency) {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid amount format.");
  }

  const scale = CURRENCY_SCALE[currency];
  const [whole, fractionRaw = ""] = normalized.split(".");
  if (fractionRaw.length > scale) {
    throw new Error(`Amount for ${currency} must have at most ${scale} decimal places.`);
  }

  const fraction = `${fractionRaw}${"0".repeat(scale - fractionRaw.length)}`;
  const minorText = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  return BigInt(minorText || "0");
}

export function formatMinorToAmount(minor: bigint, currency: Currency) {
  const divisor = SCALE_DIVISOR[currency];
  const scale = CURRENCY_SCALE[currency];

  if (scale === 0) {
    return minor.toString();
  }

  const whole = minor / divisor;
  const fraction = (minor % divisor).toString().padStart(scale, "0");
  return `${whole.toString()}.${fraction}`;
}

export function convertMinorByRate(inputMinor: bigint, source: Currency, target: Currency, rateMicros: number) {
  const sourceScale = BigInt(10 ** CURRENCY_SCALE[source]);
  const targetScale = BigInt(10 ** CURRENCY_SCALE[target]);
  const raw = inputMinor * BigInt(rateMicros) * targetScale;
  return raw / (1_000_000n * sourceScale);
}
