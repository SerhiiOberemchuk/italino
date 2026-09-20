import Link from "next/link";
import {
  BagIcon,
  PlaneIcon,
  SearchIcon,
  TruckIcon,
} from "@/components/ui/icons";
import styles from "./how-it-works.module.css";

const STEPS = [
  {
    icon: SearchIcon,
    title: "Обирайте в каталозі",
    text: "Сумки, пляшки, одяг, канцелярія та подарунки — понад 1 300 моделей. Наявність оновлюється щодня за складом у Мілані.",
    when: "будь-коли",
  },
  {
    icon: BagIcon,
    title: "Замовляйте до п’ятниці 18:00",
    text: "Оформлюєте замовлення онлайн і безпечно оплачуєте карткою на захищеній платіжній сторінці.",
    when: "до дедлайну",
  },
  {
    icon: PlaneIcon,
    title: "Неділя — відправка з Мілана",
    text: "Формуємо щотижневу поставку та організовуємо доставку замовлень в Україну.",
    when: "щонеділі",
  },
  {
    icon: TruckIcon,
    title: "Отримуєте Новою Поштою",
    text: "5–9 днів від відправки — і посилка у відділенні, поштоматі або в кур’єра.",
    when: "5–9 днів",
  },
];

export function HowItWorks() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="how-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Як це працює</p>
          <h2 id="how-title" className="section-title">
            Чотири кроки — і замовлення у вас
          </h2>
        </div>
        <Link href="/delivery" className="btn btn--ghost">
          Деталі доставки
        </Link>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.num}>0{index + 1}</span>
            <span className={styles.icon} aria-hidden="true">
              <step.icon />
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <span className={styles.when}>{step.when}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
