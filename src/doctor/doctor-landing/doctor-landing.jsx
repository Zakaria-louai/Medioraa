import styles from "./doctor-landing.module.css";
import { useTheme } from "../contexts/themeContext";
import { Link } from "react-router";

export default function DoctorLanding() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.container}>
      <div className={styles.headerFlex}>
        <div className={styles.logoFlex}>
          <span className={styles.logo}>health_and_safety</span>
          <h2 className={styles.mediora}>MEDIORA</h2>
        </div>
        <div className={styles.signAccFlex}>
          <button onClick={toggleTheme} className={styles.themeButt}>
            <span className={styles.theme}>
              {theme === "light" ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <Link to="/signin" className={styles.signInButt}>
            Sign In
          </Link>
          <Link to="/signup" className={styles.createAccountButt}>
            Create Account
          </Link>
        </div>
      </div>

      <main className={styles.mainPage}>
        <section className={styles.firstSectionFlex}>
          <div className={styles.introFlex}>
            <div className={styles.introTopFlex}>
              <h1 className={styles.introHeader}>
                Healthcare <span className={styles.simple}>Simplified</span>
                <br />
                for Everyone
              </h1>
              <p className={styles.introPara}>
                Access world-class medical services, manage records, and
                connect with specialists instantly. Your health, managed
                effortlessly.
              </p>
            </div>
            <div className={styles.signButtFlex}>
              <Link to="/signup" className={styles.introAccButt}>
                Create Account
              </Link>
              <Link to="/signin" className={styles.introSignIn}>
                Sign In
              </Link>
            </div>
          </div>
          <div className={styles.introPicLay1}>
            <div className={styles.introPicLay2}>
              <div className={styles.introPicLay3}></div>
              <div className={styles.introPicLay4}></div>
            </div>
          </div>
        </section>

        <section className={styles.secondSection}>
          <div className={styles.serviceFlex}>
            <div className={styles.cServices}>
              <h2 className={styles.serviceHead}>Our Core Services</h2>
            </div>
            <div className={styles.serviceGrid}>
              <div className={styles.service}>
                <div className={styles.serviceIcon}>
                  <span className={styles.icon}>stethoscope</span>
                </div>
                <div className={styles.serviceDesc}>
                  <h3 className={styles.descTitle}>Telehealth</h3>
                  <p className={styles.descPara}>
                    Virtual consultations with top-rated doctors from anywhere,
                    at any time.
                  </p>
                </div>
              </div>
              <div className={styles.service}>
                <div className={styles.serviceIcon}>
                  <span className={styles.icon}>shield_person</span>
                </div>
                <div className={styles.serviceDesc}>
                  <h3 className={styles.descTitle}>Medical Records</h3>
                  <p className={styles.descPara}>
                    Secure and encrypted storage for your entire medical
                    history in one place.
                  </p>
                </div>
              </div>
              <div className={styles.service}>
                <div className={styles.serviceIcon}>
                  <span className={styles.icon}>calendar_month</span>
                </div>
                <div className={styles.serviceDesc}>
                  <h3 className={styles.descTitle}>Reservations</h3>
                  <p className={styles.descPara}>
                    Facilitated and organized reservations with medical
                    specialists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.thirdSection}>
          <div className={styles.thirdSectionFlex}>
            <h2 className={styles.priori}>Ready to prioritize your health?</h2>
            <p className={styles.prioriPara}>
              Join thousands of users managing their wellness with the most
              advanced medical platform available today.
            </p>
            <div className={styles.buttFlex}>
              <Link to="/signup" className={styles.butt}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerFlex}>
          <div className={styles.logoFlex}>
            <span className={styles.logo}>health_and_safety</span>
            <h2 className={styles.med}>Mediora</h2>
          </div>
          <div className={styles.triFlex}>
            <a className={styles.triLink} href="#">
              Privacy Policy
            </a>
            <a className={styles.triLink} href="#">
              Terms of Service
            </a>
            <a className={styles.triLink} href="#">
              Support
            </a>
          </div>
          <p className={styles.copyright}>&copy; 2026 MEDIORA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}