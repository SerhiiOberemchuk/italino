"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart";

export function CartStoreHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
}
