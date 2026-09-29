"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useOptimistic, useTransition, type ReactNode } from "react";
import type { CatalogNavCategory } from "@/lib/catalog/categories";

type NavigateOptions = {
  /** Фільтри переписують адресу (`replace`), посилання додають крок в історію (`push`). */
  history?: "push" | "replace";
};

/**
 * Спільний стан оболонки каталогу (`catalog/layout.tsx`): дані фільтрів і
 * навігація. Дані приходять промісами з сервера — кожен блок розгортає їх
 * через `use()` у власному `<Suspense>`, а сервер серіалізує їх один раз.
 * React Compiler сам мемоізує значення контексту.
 */
type CatalogContextValue = {
  categories: Promise<CatalogNavCategory[]>;
  brands: Promise<string[]>;
  /** Перехід каталогу ще триває: сітка показує стан очікування. */
  isPending: boolean;
  /** Адреса, на яку зараз переходимо; `null` — показуємо поточну. */
  pendingHref: string | null;
  navigate: (href: Route, options?: NavigateOptions) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  categories,
  brands,
  children,
}: {
  categories: Promise<CatalogNavCategory[]>;
  brands: Promise<string[]>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Оптимістична адреса: вибраний бренд, категорія й заголовок змінюються
  // одразу, ще до відповіді сервера, і повертаються до URL, коли перехід завершиться.
  const [pendingHref, setPendingHref] = useOptimistic<string | null>(null);

  function navigate(href: Route, { history = "replace" }: NavigateOptions = {}) {
    const current = pendingHref ?? `${window.location.pathname}${window.location.search}`;
    if (href === current) return;
    startTransition(() => {
      setPendingHref(href);
      if (history === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    });
  }

  return (
    <CatalogContext.Provider value={{ categories, brands, isPending, pendingHref, navigate }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog: немає CatalogProvider вище по дереву");
  return context;
}

function splitHref(href: string): { path: string; query: string } {
  const index = href.indexOf("?");
  return index < 0 ? { path: href, query: "" } : { path: href.slice(0, index), query: href.slice(index + 1) };
}

/**
 * Шлях, який каталог показує: цільовий під час переходу, інакше поточний.
 * Без `useSearchParams()`, тож заголовок `/catalog` лишається в статичній оболонці.
 */
export function useCatalogPath(): string {
  const { pendingHref } = useCatalog();
  const pathname = usePathname();
  return pendingHref ? splitHref(pendingHref).path : pathname;
}

/** Шлях і параметри, які каталог показує (з урахуванням переходу, що триває). */
export function useCatalogLocation(): { path: string; search: URLSearchParams } {
  const { pendingHref } = useCatalog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { path, query } = splitHref(pendingHref ?? `${pathname}?${searchParams.toString()}`);
  return { path, search: new URLSearchParams(query) };
}

function scrollToResults() {
  const results = document.getElementById("catalog-results");
  if (results && results.getBoundingClientRect().top < 0) results.scrollIntoView({ block: "start" });
}

/**
 * Посилання всередині каталогу. Перехід веде `CatalogProvider`, тож сітка
 * одразу отримує стан очікування. Клік із модифікатором (нова вкладка) і
 * передзавантаження працюють, як у звичайного `Link`.
 */
export function CatalogLink({
  href,
  history = "push",
  scrollToResults: scrollOnNavigate = false,
  className,
  rel,
  children,
}: {
  href: Route;
  history?: NavigateOptions["history"];
  /** Пагінація: після кліку внизу сторінки показати початок результатів. */
  scrollToResults?: boolean;
  className?: string;
  rel?: string;
  children: ReactNode;
}) {
  const { navigate } = useCatalog();
  return (
    <Link
      href={href}
      className={className}
      rel={rel}
      onNavigate={(event) => {
        event.preventDefault();
        navigate(href, { history });
        if (scrollOnNavigate) scrollToResults();
      }}
    >
      {children}
    </Link>
  );
}
