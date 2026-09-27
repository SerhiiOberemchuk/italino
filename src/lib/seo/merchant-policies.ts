const RETURN_POLICY_PATH = "/returns#merchant-return-policy";
const SHIPPING_POLICY_PATH = "/delivery#shipping-policy";

export function merchantPolicyIds(siteUrl: URL) {
  return {
    returnPolicy: new URL(RETURN_POLICY_PATH, siteUrl).toString(),
    shippingService: new URL(SHIPPING_POLICY_PATH, siteUrl).toString(),
  };
}

/**
 * Загальні правила магазину для Google merchant listings.
 *
 * Вартість останньої милі залежить від тарифу перевізника, тому її тут не
 * вигадуємо. ShippingService все одно правдиво описує напрямок і строки, а
 * конкретну суму покупець бачить за тарифом Нової Пошти.
 */
export function merchantPolicies(siteUrl: URL) {
  const ids = merchantPolicyIds(siteUrl);

  return {
    returnPolicy: {
      "@type": "MerchantReturnPolicy",
      "@id": ids.returnPolicy,
      applicableCountry: "UA",
      returnPolicyCountry: "UA",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      itemCondition: "https://schema.org/NewCondition",
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      refundType: "https://schema.org/FullRefund",
      merchantReturnLink: new URL("/returns", siteUrl).toString(),
    },
    shippingService: {
      "@type": "ShippingService",
      "@id": ids.shippingService,
      name: "Доставка Новою Поштою по Україні",
      description: "Доставка до відділення або поштомату за тарифами Нової Пошти.",
      fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
      shippingConditions: {
        "@type": "ShippingConditions",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "UA",
        },
        transitTime: {
          "@type": "ServicePeriod",
          duration: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
    },
  };
}

/** Посилання з конкретної пропозиції на загальні політики магазину. */
export function offerPolicyReferences(siteUrl: URL) {
  const ids = merchantPolicyIds(siteUrl);

  return {
    hasMerchantReturnPolicy: { "@id": ids.returnPolicy },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      hasShippingService: { "@id": ids.shippingService },
    },
  };
}
