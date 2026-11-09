import { afterEach, describe, expect, it, vi } from "vitest";

const sendGAEvent = vi.hoisted(() => vi.fn());
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

const params = { transaction_id: "italino-1", value: 300, currency: "UAH" };

async function loadAnalytics(id = "AW-1", label = "purchase-label") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", id);
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL", label);
  return import("@/lib/analytics");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  sendGAEvent.mockClear();
});

describe("Google Ads", () => {
  it("configures the tag and sends the conversion to the Ads destination", async () => {
    vi.stubGlobal("gtag", vi.fn());
    const { configureGoogleAds, trackAdsConversion } = await loadAnalytics();
    configureGoogleAds();
    trackAdsConversion(params);
    expect(sendGAEvent.mock.calls).toEqual([
      ["config", "AW-1"],
      ["event", "conversion", { send_to: "AW-1/purchase-label", ...params }],
    ]);
  });

  it("stays silent without gtag or without the build variables", async () => {
    const withoutGtag = await loadAnalytics();
    withoutGtag.trackAdsConversion(params);
    vi.stubGlobal("gtag", vi.fn());
    const withoutLabel = await loadAnalytics("AW-1", "");
    withoutLabel.trackAdsConversion(params);
    const withoutId = await loadAnalytics("", "purchase-label");
    withoutId.configureGoogleAds();
    withoutId.trackAdsConversion(params);
    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});
