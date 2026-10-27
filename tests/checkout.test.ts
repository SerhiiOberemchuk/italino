import { describe, expect, it } from "vitest";
import { cartFingerprint, checkoutAttempt, CHECKOUT_ATTEMPT_KEY } from "@/lib/checkout/attempt";
import { checkoutContactErrors } from "@/lib/checkout/contact-validation";
const cart = [{sku:"SKU-1", quantity:1, price:100, currency:"UAH"}];
describe("checkout retries", () => {
  it("reuses an attempt for repeated submission of an unchanged cart", () => {
    const fingerprint = cartFingerprint(cart);
    expect(checkoutAttempt(fingerprint)).toBe(checkoutAttempt(fingerprint));
  });
  it("starts a new attempt after quantity or price changes", () => {
    const first = checkoutAttempt(cartFingerprint(cart));
    const quantity = checkoutAttempt(cartFingerprint([{...cart[0], quantity:2}]));
    expect(quantity).not.toBe(first);
    expect(checkoutAttempt(cartFingerprint([{...cart[0], quantity:2, price:101}]))).not.toBe(quantity);
  });
  it("recovers from corrupt attempt storage", () => {
    sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({id:"broken",fingerprint:cartFingerprint(cart)}));
    expect(checkoutAttempt(cartFingerprint(cart))).toMatch(/^[0-9a-f-]{36}$/);
  });
});
describe("contact field errors", () => {
  it("maps invalid contacts and missing directory selection to their fields", () => {
    const errors = checkoutContactErrors({firstName:" ",lastName:"",phone:"",email:"invalid",city:"",consent:""});
    expect(Object.keys(errors)).toEqual(["firstName","lastName","phone","email","cityRef","consent"]);
  });
  it("accepts existing valid contact semantics", () => {
    expect(checkoutContactErrors({firstName:"Олена",lastName:"Тест",phone:"+380970000000",email:"test@example.com",city:"Київ",consent:"accepted"})).toEqual({});
  });
});
