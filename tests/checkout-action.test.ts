import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitCheckout } from "@/app/checkout/actions";
import { getCapabilities, getLiveProductBySku } from "@/lib/crm/catalog";
import { crmPost, CrmError } from "@/lib/crm/client";
import { getOrCreatePaymentLink, getStoreOrderStatus } from "@/lib/crm/orders";
import { ROZETKAPAY_PAYMENT_KEY } from "@/lib/store";
import type { CrmProduct } from "@/lib/crm/types";
vi.mock("next/headers", () => ({headers:vi.fn(async () => new Headers())}));
vi.mock("@/lib/rate-limit", () => ({allowRequest:()=>true,clientKeyFromHeaders:()=>"test"}));
vi.mock("@/lib/crm/catalog", () => ({getCapabilities:vi.fn(),getLiveProductBySku:vi.fn()}));
vi.mock("@/lib/crm/orders", () => ({getOrCreatePaymentLink:vi.fn(),getStoreOrderStatus:vi.fn()}));
vi.mock("@/lib/crm/client", async (original) => ({...await original<typeof import("@/lib/crm/client")>(),crmPost:vi.fn()}));
const id = "b3e83870-8914-4f4e-8010-bdc7fd31aabc";
const product = {id:"product",sku:"SKU-1",name:"Товар",price:100,currency:"UAH",status:"active",availability:"in_stock",stock:5,availableQuantity:5,images:[],color:null,size:null} as unknown as CrmProduct;
function checkoutData() {
  const data = new FormData();
  Object.entries({attemptId:id,items:JSON.stringify([{sku:"SKU-1",quantity:1,price:100,currency:"UAH"}]),firstName:"Олена",lastName:"Тест",phone:"+380970000000",email:"test@example.com",city:"Київ",branch:"Відділення №1",shipping:"nova_poshta",payment:ROZETKAPAY_PAYMENT_KEY,consent:"accepted"})
    .forEach(([key,value])=>data.set(key,value));
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLiveProductBySku).mockResolvedValue(product);
  vi.mocked(getCapabilities).mockResolvedValue({cart:{currency:"UAH",minOrderAmount:null,freeShippingThreshold:null},payments:[{key:ROZETKAPAY_PAYMENT_KEY,paymentLink:true}]} as unknown as Awaited<ReturnType<typeof getCapabilities>>);
  vi.stubEnv("SITE_URL", "https://italino.shop");
  vi.mocked(getStoreOrderStatus).mockResolvedValue({totalAmount:100} as unknown as Awaited<ReturnType<typeof getStoreOrderStatus>>);
  vi.mocked(getOrCreatePaymentLink).mockResolvedValue({checkoutUrl:"https://payments.example.com/recovered"} as Awaited<ReturnType<typeof getOrCreatePaymentLink>>);
});
describe("checkout server contract", () => {
  it("keeps the same external order ID on retry and recovers a duplicate without another payment creation", async () => {
    let submissions = 0;
    vi.mocked(crmPost).mockImplementation(async (path: string) => {
      if (path === "orders") {
        if (++submissions > 1) throw new CrmError("HTTP_409",409);
        return {data:{externalId:`italino-${id}`,deduplicated:false}};
      }
      return {data:{checkoutUrl:"https://payments.example.com/new"}};
    });
    const first = await submitCheckout({status:"idle"},checkoutData());
    const retry = await submitCheckout({status:"idle"},checkoutData());
    expect(first.status).toBe("success");
    expect(retry.orderId).toBe(first.orderId);
    const orders = vi.mocked(crmPost).mock.calls.filter(([path])=>path === "orders");
    expect(orders.map(([,body])=>(body as {externalId:string}).externalId)).toEqual([`italino-${id}`,`italino-${id}`]);
    expect(vi.mocked(crmPost).mock.calls.filter(([path])=>path.endsWith("payment-link"))).toHaveLength(1);
    expect(getOrCreatePaymentLink).toHaveBeenCalledTimes(1);
  });
  it("returns field errors before accessing CRM for invalid contacts", async () => {
    const data = checkoutData(); data.set("email","invalid");
    const result = await submitCheckout({status:"idle"},data);
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(getLiveProductBySku).not.toHaveBeenCalled();
    expect(crmPost).not.toHaveBeenCalled();
  });
  it("refreshes changed CRM prices instead of creating an order", async () => {
    vi.mocked(getLiveProductBySku).mockResolvedValue({...product,price:120});
    vi.mocked(getStoreOrderStatus).mockRejectedValueOnce(new CrmError("HTTP_404",404));
    const result = await submitCheckout({status:"idle"},checkoutData());
    expect(crmPost).not.toHaveBeenCalled();
    expect(result.status).toBe("cart_changed");
    expect(result.items?.[0].price).toBe(120);
  });
  it("removes an unavailable SKU before creating an order", async () => {
    vi.mocked(getLiveProductBySku).mockResolvedValue({...product,availableQuantity:0});
    vi.mocked(getStoreOrderStatus).mockRejectedValueOnce(new CrmError("HTTP_404",404));
    const result = await submitCheckout({status:"idle"},checkoutData());
    expect(result.status).toBe("cart_changed");
    expect(result.items).toEqual([]);
    expect(crmPost).not.toHaveBeenCalled();
  });
});
