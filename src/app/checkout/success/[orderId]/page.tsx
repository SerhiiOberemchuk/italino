import Link from "next/link";
import { Suspense } from "react";
import { PaymentButton } from "@/components/checkout/payment-button";
import styles from "../../../shop.module.css";
type SuccessProps = { params: Promise<{ orderId: string }> };
async function Content({ params }: SuccessProps) { const { orderId } = await params; return <div className={styles.success}><p className="eyebrow">Замовлення прийнято</p><h1>Дякуємо!</h1><p>Ми отримали замовлення та зв’яжемося з вами для підтвердження. Найближча відправка зі складу — цієї неділі.</p><p className={styles.orderId}>Номер: {orderId}</p><PaymentButton orderId={orderId} /><p><Link href="/catalog"><u>Продовжити покупки</u></Link></p></div>; }
export default function Page(props: SuccessProps) { return <main className={`wrap ${styles.page}`}><Suspense fallback={<p className={styles.empty}>Завантажуємо…</p>}><Content params={props.params} /></Suspense></main>; }
