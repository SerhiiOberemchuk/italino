import { InstagramIcon, SendIcon } from "@/components/ui/icons";
import styles from "./newsletter.module.css";

export function Newsletter() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="news-title">
      <div className={styles.panel}>
        <div>
          <h2 id="news-title">Нові надходження — першими</h2>
          <p>
            Раз на тиждень надсилаємо добірку речей, які приїдуть наступною
            поставкою. Без спаму, відписка в один клік.
          </p>
        </div>
        <div>
          {/* Обробник підписки буде додано разом із бекендом розсилки. */}
          <form className={styles.form} action="#" method="post">
            <input
              type="email"
              name="email"
              placeholder="Ваш e-mail"
              aria-label="E-mail для підписки"
              autoComplete="email"
            />
            <button type="submit" className="btn btn--primary btn--sm">
              Підписатися
            </button>
          </form>
          <div className={styles.socials}>
            <a href="https://t.me" className="btn btn--ghost btn--sm" rel="noreferrer">
              <SendIcon /> Telegram
            </a>
            <a
              href="https://instagram.com"
              className="btn btn--ghost btn--sm"
              rel="noreferrer"
            >
              <InstagramIcon /> Instagram
            </a>
          </div>
          <p className={styles.hint}>
            Натискаючи «Підписатися», ви погоджуєтесь із політикою конфіденційності.
          </p>
        </div>
      </div>
    </section>
  );
}
