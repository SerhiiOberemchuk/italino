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
    title: "Напряму зі складу в Мілані",
    text: "Забираємо товар у постачальника без перекупників і самі веземо в Україну. Статус замовлення видно на кожному етапі.",
  },
  {
    icon: CreditCardIcon,
    title: "Ціна в гривнях без сюрпризів",
    text: "Доставку з Мілана до України вже враховано в ціні на сайті.",
    // Дописується фразою про безкоштовну Нову Пошту, якщо поріг задано в CRM.
    freeShippingNote: true,
  },
  {
    icon: TruckIcon,
    title: "Від однієї штуки до партії",
    text: "Один рюкзак для себе чи п’ятдесят для команди — від 50 штук діють оптові ціни.",
  },
  {
    icon: RefreshIcon,
    title: "14 днів на обмін і повернення",
    text: "Не підійшов колір чи розмір — обміняємо або повернемо кошти протягом 14 днів з моменту отримання.",
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
              Замовити з Мілана — так само просто, як у сусідньому магазині
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
