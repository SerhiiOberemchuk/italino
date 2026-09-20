import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";
import styles from "../shop.module.css";
export const metadata: Metadata = { title: "Кошик" };
export default function Page() { return <main className={`wrap ${styles.page}`}><div className={styles.hero}><div><p className="eyebrow">Покупки</p><h1>Кошик</h1></div></div><CartPage /></main>; }
