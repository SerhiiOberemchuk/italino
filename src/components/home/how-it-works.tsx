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
    title: "Обирайте в каталозі",
    text: "Сумки, пляшки, одяг, канцелярія та подарунки — понад 1 300 моделей. Наявність оновлюється щодня за складом у Мілані.",
    when: "будь-коли",
  },
  {
    icon: BagIcon,
    title: `Замовляйте ${SCHEDULE_COPY.cutoffUntil}`,
    text: "Оформлюєте замовлення онлайн і безпечно оплачуєте карткою на захищеній платіжній сторінці.",
    when: "до дедлайну",
  },
  {
    icon: PlaneIcon,
    title: `${SCHEDULE_COPY.dispatchName[0].toUpperCase()}${SCHEDULE_COPY.dispatchName.slice(1)} — відправка з Мілана`,
    text: "Формуємо щотижневу поставку та організовуємо доставку замовлень в Україну.",
    when: SCHEDULE_COPY.dispatchEvery,
  },
  {
    icon: TruckIcon,
    title: "Отримуєте Новою Поштою",
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
