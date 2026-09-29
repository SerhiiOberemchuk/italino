import type { Route } from "next";
import type { CatalogCard } from "@/lib/catalog/product-cards";
import type { CrmCategory } from "@/lib/crm/types";

export const CATEGORY_TINTS = ["lime", "sky", "tomato", "mint", "sand"] as const;

export type CategoryTint = (typeof CATEGORY_TINTS)[number];

export type CatalogCategoryLink = {
  id: string;
  name: string;
  href: Route;
  depth: number;
};

/** Пункт навігації каталогу: фільтр категорій, заголовок, підкатегорії. */
export type CatalogNavCategory = CatalogCategoryLink & {
  parentId: string | null;
};

export type HomeCategory = CatalogCategoryLink & {
  image: string | null;
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

export function categoryLinks(categories: readonly CrmCategory[]): CatalogNavCategory[] {
  const children = new Map<string | null, CrmCategory[]>();
  const ids = new Set(categories.map((category) => category.id));
  const parentOf = (category: CrmCategory) =>
    category.parentId && ids.has(category.parentId) ? category.parentId : null;

  for (const category of categories) {
    const parent = parentOf(category);
    const siblings = children.get(parent);
    if (siblings) siblings.push(category);
    else children.set(parent, [category]);
  }

  const links: CatalogNavCategory[] = [];
  const visit = (category: CrmCategory, depth: number) => {
    links.push({
      id: category.id,
      name: category.name,
      href: `/catalog/${encodeURIComponent(categoryKey(category))}` as Route,
      depth,
      parentId: parentOf(category),
    });
    for (const child of children.get(category.id) ?? []) visit(child, depth + 1);
  };

  for (const root of children.get(null) ?? []) visit(root, 0);
  return links;
}

function decodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Категорія за адресою `/catalog/<key>`; для `/catalog` та невідомих адрес — `undefined`. */
export function categoryByPath<T extends CatalogCategoryLink>(links: readonly T[], path: string): T | undefined {
  const decoded = decodePath(path);
  return links.find((link) => decodePath(link.href) === decoded);
}

/**
 * Плитки головної. Фото — власне фото категорії з CRM, інакше фото моделі з
 * першої сторінки каталогу (вона вже є в кеші), інакше плитка лише кольорова.
 */
export function homeCategories(
  categories: readonly CrmCategory[],
  cards: readonly CatalogCard[],
): HomeCategory[] {
  return rootCategories(categories).map((category, index) => {
    const branchIds = categoryBranchIds(categories, category.id);
    const image = category.imageUrl
      || cards.find((card) => card.image && card.categoryIds.some((id) => branchIds.has(id)))?.image
      || null;

    return {
      id: category.id,
      name: category.name,
      href: `/catalog/${encodeURIComponent(categoryKey(category))}` as Route,
      depth: 0,
      image,
      tint: CATEGORY_TINTS[index % CATEGORY_TINTS.length],
    };
  });
}
