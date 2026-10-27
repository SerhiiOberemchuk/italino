import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { submitCheckout } from "@/app/checkout/actions";
import { useCartStore } from "@/lib/cart";
vi.mock("next/navigation", () => ({useRouter:()=>({replace:vi.fn(),push:vi.fn()})}));
vi.mock("next/link", () => ({default:"a"}));
vi.mock("@/lib/analytics", () => ({trackEvent:vi.fn()}));
vi.mock("@/app/checkout/actions", () => ({submitCheckout:vi.fn(async()=>({status:"error",message:"Тестова відповідь сервера"}))}));
vi.mock("@/components/checkout/nova-poshta-fields", () => ({NovaPoshtaFields:()=> <>
  <input type="hidden" name="city" value="Київ" /><input type="hidden" name="cityRef" value="city-key" />
  <input type="hidden" name="branch" value="Відділення №1" /><input type="hidden" name="branchRef" value="branch-key" />
</>}));
it("submits the existing contact, consent, address and retry fields through HeroUI Form", async () => {
  const user = userEvent.setup();
  useCartStore.setState({hydrated:true,items:[{productId:"product",sku:"SKU-1",name:"Товар",price:100,currency:"UAH",quantity:1,image:null,color:null,size:null,maxQuantity:5}]});
  const capabilities = Promise.resolve({payments:[{key:"rozetkapay",label:"Картка",paymentLink:true,kind:"adapter" as const,status:"active" as const}],minOrderAmount:null,freeShippingFrom:null});
  await act(async () => {render(<Suspense fallback="Завантаження"><CheckoutForm capabilities={capabilities} /></Suspense>);});
  await user.type(await screen.findByRole("textbox",{name:"Ім’я"}),"Олена");
  await user.type(screen.getByRole("textbox",{name:"Прізвище"}),"Тест");
  await user.type(screen.getByRole("textbox",{name:"Телефон"}),"+380970000000");
  await user.type(screen.getByRole("textbox",{name:"E-mail"}),"customer@example.com");
  await user.click(screen.getByRole("checkbox",{name:/Погоджуюся/}));
  await user.click(screen.getByRole("button",{name:"Перейти до оплати"}));
  await waitFor(()=>expect(submitCheckout).toHaveBeenCalledTimes(1));
  const data = vi.mocked(submitCheckout).mock.calls[0][1];
  expect(data.get("firstName")).toBe("Олена");
  expect(data.get("consent")).toBe("accepted");
  expect(data.get("cityRef")).toBe("city-key");
  expect(data.get("branchRef")).toBe("branch-key");
  expect(data.get("attemptId")).toMatch(/^[0-9a-f-]{36}$/);
  expect(JSON.parse(String(data.get("items")))).toEqual([{sku:"SKU-1",quantity:1,price:100,currency:"UAH"}]);
  expect((screen.getByRole("textbox",{name:"Ім’я"}) as HTMLInputElement).value).toBe("Олена");
});
