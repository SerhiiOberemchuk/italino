import { useState, type AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { QuantityField } from "@/components/cart/quantity-field";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NovaPoshtaFields } from "@/components/checkout/nova-poshta-fields";
import { ContactField } from "@/components/checkout/contact-field";
import { Form } from "@heroui/react/form";

vi.mock("next/link", () => ({ default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));

describe("shipping selection", () => {
  it("clears an existing selection even while a new request is loading", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [selected, setSelected] = useState<ComboboxOption | null>({value:"old",label:"Київ"});
      return <form aria-label="Адреса"><Combobox name="cityRef" label="Місто" placeholder="Місто"
        options={[]} selected={selected} onSelect={setSelected} onQueryChange={() => {}} loading emptyMessage="Немає" /></form>;
    }
    render(<Harness />);
    await user.clear(screen.getByRole("combobox"));
    expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("cityRef")).not.toBe("old");
  });
  it("does not commit an old suggestion with Enter while loading", async () => {
    const selected = vi.fn();
    const user = userEvent.setup();
    render(<Combobox label="Місто" placeholder="Місто" options={[{value:"old",label:"Старе місто"}]}
      selected={null} onSelect={selected} onQueryChange={() => {}} loading emptyMessage="Немає" />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.queryByRole("option", {name:"Старе місто"})).toBeNull();
    expect(selected.mock.calls.some(([option]) => option?.value === "old")).toBe(false);
  });

  it("submits a directory key after explicit selection", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [selected, setSelected] = useState<ComboboxOption | null>(null);
      return <form aria-label="Адреса"><Combobox name="cityRef" label="Місто" placeholder="Місто"
        options={[{value:"city-id", label:"Київ"}]} selected={selected} onSelect={setSelected}
        onQueryChange={() => {}} emptyMessage="Немає" /></form>;
    }
    render(<Harness />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", {name:"Київ"}));
    const form = screen.getByRole("form") as HTMLFormElement;
    expect(new FormData(form).get("cityRef")).toBe("city-id");
    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "Довільний текст");
    expect(new FormData(form).get("cityRef")).not.toBe("city-id");
  });

  it("ignores a late city response and clears the warehouse when city changes", async () => {
    const user = userEvent.setup();
    const requests: {url:string; resolve:(response:Response)=>void}[] = [];
    vi.stubGlobal("fetch", vi.fn((url: string) => new Promise<Response>((resolve) => requests.push({url, resolve}))));
    render(<form aria-label="Доставка"><NovaPoshtaFields /></form>);
    const city = screen.getByRole("combobox", {name:"Місто"});
    await user.type(city, "Ки");
    await waitFor(() => expect(requests.some(request => request.url.includes(encodeURIComponent("Ки")))).toBe(true));
    const old = requests.find(request => request.url.includes(encodeURIComponent("Ки")))!;
    await user.clear(city);
    await user.type(city, "Ль");
    await waitFor(() => expect(requests.some(request => request.url.includes(encodeURIComponent("Ль")))).toBe(true));
    const current = requests.find(request => request.url.includes(encodeURIComponent("Ль")))!;
    await act(async () => current.resolve(new Response(JSON.stringify({cities:[{ref:"lviv",label:"Львів"}]}))));
    await user.click(await screen.findByRole("option", {name:"Львів"}));
    await act(async () => old.resolve(new Response(JSON.stringify({cities:[{ref:"kyiv",label:"Київ"}]}))));
    const form = screen.getByRole("form") as HTMLFormElement;
    expect(new FormData(form).get("cityRef")).toBe("lviv");
    expect(screen.queryByRole("option", {name:"Київ"})).toBeNull();
    await waitFor(() => expect(requests.some(request => request.url.includes("warehouses"))).toBe(true));
    const warehouse = requests.find(request => request.url.includes("warehouses"))!;
    await act(async () => warehouse.resolve(new Response(JSON.stringify({warehouses:[{ref:"branch-1",label:"Відділення №1"}], total:1}))));
    await user.click(screen.getByRole("combobox", {name:"Відділення або поштомат"}));
    await user.click(await screen.findByRole("option", {name:"Відділення №1"}));
    expect(new FormData(form).get("branchRef")).toBe("branch-1");
    await user.clear(city);
    expect(new FormData(form).get("branchRef")).not.toBe("branch-1");
    await user.keyboard("{Escape}");
    expect((screen.getByRole("combobox", {name:"Відділення або поштомат"}) as HTMLInputElement).disabled).toBe(true);
  });
});

describe("drawer", () => {
  it("keeps keyboard focus inside and returns it to the trigger on Escape", async () => {
    const user = userEvent.setup();
    render(<><button>Перед меню</button><MobileMenu /><button>Після меню</button></>);
    const trigger = screen.getByRole("button", {name:"Відкрити меню"});
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", {name:"Мобільне меню"});
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    for (let i = 0; i < 18; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe("quantity", () => {
  it("keeps one item, respects stock and ignores invalid drafts", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    function Harness() {
      const [value,setValue] = useState(1);
      return <QuantityField value={value} max={2} label="Кількість товару" onChange={next => { changed(next); setValue(next); }} />;
    }
    render(<Harness />);
    expect((screen.getByRole("button", {name:"Зменшити кількість"}) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", {name:"Збільшити кількість"}));
    expect((screen.getByLabelText("Кількість товару") as HTMLInputElement).value).toBe("2");
    expect((screen.getByRole("button", {name:"Збільшити кількість"}) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Кількість товару"), {target:{value:""}});
    await user.tab();
    expect(changed.mock.calls.every(([value]) => Number.isInteger(value) && value >= 1 && value <= 2)).toBe(true);
  });
});

it("connects a server error to its contact field and clears it after correction", async () => {
  const user = userEvent.setup();
  render(<Form aria-label="Контакти" validationErrors={{email:"Перевірте адресу пошти"}}>
    <ContactField label="E-mail" name="email" type="email" maxLength={255} autoComplete="email" />
  </Form>);
  expect(await screen.findByText("Перевірте адресу пошти")).toBeTruthy();
  const email = screen.getByRole("textbox", {name:"E-mail"});
  await user.type(email, "customer@example.com");
  await user.tab();
  await waitFor(() => expect(screen.queryByText("Перевірте адресу пошти")).toBeNull());
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("email")).toBe("customer@example.com");
});
