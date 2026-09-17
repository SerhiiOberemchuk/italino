import {
  CreditCardIcon,
  PackageIcon,
  RefreshIcon,
  TruckIcon,
} from "@/components/ui/icons";
import styles from "./why-italino.module.css";

// Тексти переваг — припущення до підтвердження (docs/PROJECT.md → Відкриті питання).
const ITEMS = [
  {
    icon: PackageIcon,
    title: "Прямо зі складу в Мілані",
    text: "Забираємо товар у постачальника особисто й веземо в Україну однією поставкою на тиждень. Без ланцюжка посередників.",
  },
  {
    icon: CreditCardIcon,
    title: "Ціна в гривні без сюрпризів",
    text: "Доставка до України вже врахована у ціні на сайті. Ви бачите фінальну суму одразу.",
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

export function WhyItalino() {
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
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
