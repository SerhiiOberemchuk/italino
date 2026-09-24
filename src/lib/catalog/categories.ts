import type { Route } from "next";
import type { CatalogModel } from "@/lib/catalog/catalog-index";
import type { CrmCategory, CrmProduct } from "@/lib/crm/types";

export const CATEGORY_TINTS = ["lime", "sky", "tomato", "mint", "sand"] as const;

export type CategoryTint = (typeof CATEGORY_TINTS)[number];

export type CatalogCategoryLink = {
  id: string;
  name: string;
  href: Route;
  depth: number;
};

export type HomeCategory = CatalogCategoryLink & {
  image: string | null;
  note: string;
  tint: CategoryTint;
};

export function categoryKey(category: CrmCategory): string {
  return category.slug?.trim() || category.id;
}

export function findCategory(categories: readonly CrmCategory[], key: string): CrmCategory | undefined {
  return categories.find((category) => categoryKey(category) === key || category.id === key);
}

export function categoryBranchIds(categories: readonly CrmCategory[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }

  return ids;
}

export function rootCategories(categories: readonly CrmCategory[]): CrmCategory[] {
  const ids = new Set(categories.map((category) => category.id));
  return categories.filter((category) => !category.parentId || !ids.has(category.parentId));
}

/**
 * Залишає лише категорії, до яких прив'язані товари вітрини, та їхніх предків.
 * Предки потрібні, щоб вкладена категорія не випадала з дерева навігації.
 */
export function usedCategories(
  categories: readonly CrmCategory[],
  products: readonly CrmProduct[],
): CrmCategory[] {
  return usedCategoriesByIds(
    categories,
    products.flatMap((product) => product.category?.id ? [product.category.id] : []),
  );
}

export function usedCategoriesByIds(
  categories: readonly CrmCategory[],
  categoryIds: Iterable<string>,
): CrmCategory[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const usedIds = new Set(categoryIds);

  for (const categoryId of [...usedIds]) {
    let category = byId.get(categoryId);
    const visited = new Set<string>();
    while (category?.parentId && !visited.has(category.id)) {
      visited.add(category.id);
      usedIds.add(category.parentId);
      category = byId.get(category.parentId);
    }
  }

  return categories.filter((category) => usedIds.has(category.id));
}

export function categoryLinks(
  categories: readonly CrmCategory[],
  rootsOnly = false,
): CatalogCategoryLink[] {
  const children = new Map<string | null, CrmCategory[]>();
  const ids = new Set(categories.map((category) => category.id));

  for (const category of categories) {
    const parent = category.parentId && ids.has(category.parentId) ? category.parentId : null;
    const siblings = children.get(parent);
    if (siblings) siblings.push(category);
    else children.set(parent, [category]);
  }

  const links: CatalogCategoryLink[] = [];
  const visit = (category: CrmCategory, depth: number) => {
    links.push({
      id: category.id,
      name: category.name,
      href: `/catalog/${encodeURIComponent(categoryKey(category))}` as Route,
      depth,
    });
    if (!rootsOnly) {
      for (const child of children.get(category.id) ?? []) visit(child, depth + 1);
    }
  };

  for (const root of children.get(null) ?? []) visit(root, 0);
  return links;
}

export function homeCategories(
  categories: readonly CrmCategory[],
  models: readonly CatalogModel[],
): HomeCategory[] {
  return rootCategories(categories).map((category, index) => {
    const branchIds = categoryBranchIds(categories, category.id);
    const branchModels = models.filter((model) => (
      model.categoryIds.some((categoryId) => branchIds.has(categoryId))
    ));
    const image = branchModels.find((model) => model.image)?.image ?? null;

    return {
      id: category.id,
      name: category.name,
      href: `/catalog/${encodeURIComponent(categoryKey(category))}` as Route,
      depth: 0,
      image,
      note: `${branchModels.length} ${branchModels.length === 1 ? "модель" : "моделей"}`,
      tint: CATEGORY_TINTS[index % CATEGORY_TINTS.length],
    };
  });
}
