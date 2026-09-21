import {
  CreditCardIcon,
  PackageIcon,
  RefreshIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { getFreeShippingThreshold } from "@/lib/crm/catalog";
import { formatThreshold } from "@/lib/shipping/free-shipping";
import styles from "./why-italino.module.css";

// Тексти переваг — припущення до підтвердження (docs/PROJECT.md → Відкриті питання).
const ITEMS = [
  {
    icon: PackageIcon,
    title: "Прямо зі складу в Мілані",
    text: "Формуємо щотижневі поставки та організовуємо доставку замовлень в Україну. Контролюємо шлях замовлення на кожному етапі.",
  },
  {
    icon: CreditCardIcon,
    title: "Ціна в гривні без сюрпризів",
    text: "Доставку з Мілана до України вже враховано в ціні на сайті.",
    // Дописується фразою про безкоштовну Нову Пошту, якщо поріг задано в CRM.
    freeShippingNote: true,
  },
  {
    icon: TruckIcon,
    title: "Від однієї штуки до партії",
    text: "Одна пляшка для себе або двісті шоперів для команди — оптові ціни від 50 шт.",
  },
  {
    icon: RefreshIcon,
    title: "Обмін і повернення 14 днів",
    text: "Не підійшов розмір чи колір — обміняємо з наступною поставкою або повернемо кошти.",
  },
];

export async function WhyItalino() {
  const freeFrom = await getFreeShippingThreshold();
  return (
    <section className={styles.section} aria-labelledby="why-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Чому Italino</p>
            <h2 id="why-title" className="section-title">
              Замовляти з Європи — так само просто, як удома
            </h2>
          </div>
        </div>

        <ul className={styles.grid}>
          {ITEMS.map((item) => (
            <li key={item.title} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">
                <item.icon />
              </span>
              <h3>{item.title}</h3>
              <p>
                {item.text}
                {"freeShippingNote" in item && freeFrom !== null
                  ? ` Від ${formatThreshold(freeFrom)} безкоштовна й доставка Новою Поштою.`
                  : null}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
