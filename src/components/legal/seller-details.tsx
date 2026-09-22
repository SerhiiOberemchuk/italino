import styles from "@/app/legal/legal.module.css";
import { STORE } from "@/lib/store";

export function SellerDetails() {
  return <dl className={styles.requisites}>
    <div><dt>Продавець</dt><dd>{STORE.legalName}</dd></div>
    <div><dt>РНОКПП</dt><dd>{STORE.taxId}</dd></div>
    <div><dt>Запис у ЄДР</dt><dd>{STORE.edrRecord} від {STORE.edrDate}</dd></div>
    <div><dt>Адреса (юридична та фактична)</dt><dd>{STORE.address}</dd></div>
    <div><dt>Телефон</dt><dd><a href={STORE.phoneHref}>{STORE.phone}</a></dd></div>
    <div><dt>E-mail</dt><dd><a href={`mailto:${STORE.email}`}>{STORE.email}</a></dd></div>
    <div><dt>Режим роботи</dt><dd>{STORE.hours[0].toUpperCase() + STORE.hours.slice(1)}</dd></div>
    <div><dt>Ліцензії</dt><dd>Діяльність продавця не підлягає ліцензуванню</dd></div>
  </dl>;
}
