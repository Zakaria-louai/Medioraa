import { useTheme } from "../contexts/themeContext";
import { useEffect, useState } from "react";
import styles from "./doctor-forgot-pass.module.css";
import DoctorForgot from "./doctor-forgot/doctor-forgot";
import DoctorNewPass from "./doctor-new-pass/doctor-new-pass";
import { Link } from "react-router";
import ForgotOtp from "./doctor-forgot-otp/forgotOtp";
export default function DoctorForgotPass() {
  const { theme, toggleTheme } = useTheme();
  const [emailR, setEmailR] = useState("");
  const [step, setStep] = useState(
    Number(sessionStorage.getItem("current") || 1),
  );
  useEffect(() => sessionStorage.setItem("current", step), [step]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [step]);

  const next = () => {
    setStep((n) => n + 1);
  };
  const prev = () => {
    setStep((n) => n - 1);
  };
  const stepsComponents = [
    <DoctorForgot emailR={emailR} setEmailR={setEmailR} next={next} />,
    <ForgotOtp email={emailR} next={next} prev={prev} />,
    <DoctorNewPass setStep={setStep} />,
  ];
  return (
    <div className={styles.contain}>
      <header className={styles.header}>
        <div className={styles.headerFlex}>
          <div className={styles.logoFlex}>
            <span className={styles.icon}>medical_services</span>
            <h1 className={styles.med}>MEDIORA</h1>
          </div>
          <div className={styles.signFlex}>
            <button onClick={toggleTheme} className={styles.themeButt}>
              <span className={styles.theme}>
                {theme === "light" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <a className={styles.helpCenter} href="#">
              Help Center
            </a>
            <Link
              to="/signin"
              onClick={() => {
                sessionStorage.removeItem("current");
                setStep(1);
              }}
              className={styles.signIn}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
      {stepsComponents[step - 1]}
      <footer className={styles.footer}>
        <div className={styles.footerFlex}>
          <p className={styles.footerPara}>
            &copy; 2026 MEDIORA Medical Systems.HIPAA compliant &amp; SOC2 Type
            II Certified.
          </p>
          <div className={styles.footerNotes}>
            <a className={styles.footerA} href="#">
              Privacy Policy
            </a>
            <a className={styles.footerA} href="#">
              Security Standards
            </a>
            <a className={styles.footerA} href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
