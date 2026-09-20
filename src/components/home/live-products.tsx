import { ProductRail } from "./product-rail";
import { getHomeProducts } from "@/lib/crm/catalog";
import { CrmError } from "@/lib/crm/client";
import { toProductCards, type ProductCard } from "@/lib/catalog/product-cards";

export async function LiveProducts() {
  let products: ProductCard[] = [];
  let unavailable = false;
  try {
    products = toProductCards(await getHomeProducts()).slice(0, 8);
  } catch (error) {
    if (!(error instanceof CrmError)) throw error;
    unavailable = true;
    console.error("[CRM catalog]", {
      code: error.code,
      status: error.status,
      requestId: error.requestId,
    });
  }

  return (
    <ProductRail
      eyebrow="Щойно в каталозі"
      title="Нові надходження"
      href="/catalog?sort=newest"
      linkLabel="Усі новинки"
      products={products}
      emptyMessage={unavailable
        ? "Не вдалося завантажити товари. Будь ласка, спробуйте пізніше."
        : "Незабаром тут з’являться товари."
      }
    />
  );
}
