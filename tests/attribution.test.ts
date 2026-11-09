import { describe, expect, it, vi } from "vitest";
import {
  ATTRIBUTION_LAST_STORAGE_KEY,
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
  captureAttribution,
  parseAttributionInput,
  readTaggedParams,
  serializeStoredAttribution,
} from "@/lib/attribution";
import { trackPurchaseOnce } from "@/lib/purchase-event";
import type { StoreOrderStatus } from "@/lib/crm/orders";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}

describe("attribution capture", () => {
  it("reads only the fixed parameter list and ignores everything else", () => {
    expect(readTaggedParams("?utm_source=google&gclid=abc&token=secret&email=a@b.c")).toEqual({ utm_source: "google", gclid: "abc" });
    expect(readTaggedParams("?token=secret")).toBeNull();
  });

  it("keeps the first tagged visit for 30 days and updates the last touch", () => {
    const storage = memoryStorage();
    captureAttribution("?utm_source=google&gclid=one", storage, 1_000);
    captureAttribution("?utm_source=meta", storage, 2_000);
    expect(JSON.parse(storage.getItem(ATTRIBUTION_STORAGE_KEY)!)).toEqual({ t: 1_000, v: { utm_source: "google", gclid: "one" } });
    expect(JSON.parse(storage.getItem(ATTRIBUTION_LAST_STORAGE_KEY)!)).toEqual({ t: 2_000, v: { utm_source: "meta" } });

    captureAttribution("?utm_source=late", storage, 1_000 + ATTRIBUTION_TTL_MS + 1);
    expect(JSON.parse(storage.getItem(ATTRIBUTION_STORAGE_KEY)!).v).toEqual({ utm_source: "late" });
  });

  it("does not touch storage for untagged visits and survives a throwing storage", () => {
    const storage = memoryStorage();
    const spy = vi.spyOn(storage, "setItem");
    captureAttribution("?page=2", storage);
    expect(spy).not.toHaveBeenCalled();
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(() => captureAttribution("?utm_source=x", broken)).not.toThrow();
    expect(serializeStoredAttribution(broken)).toBe("");
  });
});

describe("attribution parsing for the CRM", () => {
  it("builds the CRM shape, omits empty fields and clamps lengths", () => {
    const raw = JSON.stringify({ first: { t: 1, v: { utm_source: " google ", utm_medium: "", utm_campaign: "c".repeat(400), gclid: "g".repeat(600) } } });
    const result = parseAttributionInput(raw)!;
    expect(result.utmSource).toBe("google");
    expect("utmMedium" in result).toBe(false);
    expect(result.utmCampaign).toHaveLength(255);
    expect(result.clickId).toHaveLength(512);
    expect(result.clickIdParam).toBe("gclid");
    expect(Object.values(result).some((value) => value === null || value === "")).toBe(false);
  });

  it("sends a last touch only when it differs from the first", () => {
    const first = { t: 1, v: { utm_source: "google" } };
    expect(parseAttributionInput(JSON.stringify({ first, last: { t: 2, v: { utm_source: "google" } } }))?.lastTouch).toBeUndefined();
    const different = parseAttributionInput(JSON.stringify({ first, last: { t: 2_000, v: { utm_source: "meta" } } }))!;
    expect(different.lastTouch).toEqual({ utmSource: "meta", at: new Date(2_000).toISOString() });
  });

  it("returns null for empty, foreign or malformed input instead of throwing", () => {
    for (const raw of ["", "not json", "null", "[]", JSON.stringify({ first: { v: { foo: "bar" } } }), JSON.stringify({ first: { v: 5 } }), "x".repeat(9_000)]) {
      expect(parseAttributionInput(raw)).toBeNull();
    }
  });
});

describe("purchase event", () => {
  const order = {
    orderId: "italino-1", number: "1", orderStatus: "confirmed", paymentStatus: "paid", totalAmount: "300.00", currency: "UAH",
    createdAt: "", updatedAt: "", paidAt: null,
    items: [
      { productId: "p1", name: "Рюкзак", sku: "S1", quantity: 2, unitPrice: 100, total: 200 },
      { productId: null, name: "Без товару", sku: null, quantity: 1, unitPrice: 100, total: 100 },
    ],
  } as StoreOrderStatus;

  it("sends purchase and the Ads conversion once with real values and does not repeat on reload", () => {
    const storage = memoryStorage();
    const track = vi.fn(() => true);
    const conversion = vi.fn();
    expect(trackPurchaseOnce(order, storage, track, conversion)).toBe(true);
    expect(track).toHaveBeenCalledWith("purchase", {
      transaction_id: "italino-1", value: 300, currency: "UAH",
      items: [{ item_id: "p1", item_name: "Рюкзак", price: 100, quantity: 2 }],
    });
    expect(conversion).toHaveBeenCalledWith({ transaction_id: "italino-1", value: 300, currency: "UAH" });
    expect(trackPurchaseOnce(order, storage, track, conversion)).toBe(false);
    expect(track).toHaveBeenCalledTimes(1);
    expect(conversion).toHaveBeenCalledTimes(1);
  });

  it("waits for a paid order and keeps retrying while analytics is not ready", () => {
    const storage = memoryStorage();
    const track = vi.fn(() => false);
    const conversion = vi.fn();
    expect(trackPurchaseOnce({ ...order, paymentStatus: "pending" }, storage, track, conversion)).toBe(false);
    expect(track).not.toHaveBeenCalled();
    expect(trackPurchaseOnce(order, storage, track, conversion)).toBe(false);
    expect(conversion).not.toHaveBeenCalled();
    track.mockReturnValue(true);
    expect(trackPurchaseOnce(order, storage, track, conversion)).toBe(true);
    expect(conversion).toHaveBeenCalledTimes(1);
  });

  it("still sends when storage throws", () => {
    const broken = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
    expect(trackPurchaseOnce(order, broken, () => true, () => {})).toBe(true);
  });
});
