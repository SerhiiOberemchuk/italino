import Link from "next/link";
import {
  BagIcon,
  PlaneIcon,
  SearchIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { SCHEDULE_COPY } from "@/lib/shipping/schedule";
import styles from "./how-it-works.module.css";

const STEPS = [
  {
    icon: SearchIcon,
    title: "Обираєте модель",
    text: "Колір, розмір, кількість. Наявність звіряємо зі складом у Мілані щодня: якщо товар на сайті є, він поїде найближчою поставкою.",
    when: "будь-коли",
  },
  {
    icon: BagIcon,
    title: `Замовляєте ${SCHEDULE_COPY.cutoffUntil}`,
    text: "Оформлення займає кілька хвилин. Оплата — карткою онлайн на захищеній платіжній сторінці.",
    when: "до дедлайну",
  },
  {
    icon: PlaneIcon,
    title: `${SCHEDULE_COPY.dispatchName[0].toUpperCase()}${SCHEDULE_COPY.dispatchName.slice(1)} — відправка з Мілана`,
    text: "Забираємо всі замовлення тижня зі складу й веземо в Україну однією поставкою.",
    when: SCHEDULE_COPY.dispatchEvery,
  },
  {
    icon: TruckIcon,
    title: "Забираєте на Новій Пошті",
    text: `${SCHEDULE_COPY.transit} від відправки — і посилка у відділенні чи поштоматі Нової Пошти, зазвичай ${SCHEDULE_COPY.arrivalOn}.`,
    when: SCHEDULE_COPY.transit,
  },
];

export function HowItWorks() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="how-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Як це працює</p>
          <h2 id="how-title" className="section-title">
            Від кошика до посилки — чотири кроки
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
