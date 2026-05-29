import styles from "./doctor-signin.module.css";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/authContext";
import { useState } from "react";
import { TailSpin } from "react-loader-spinner";
// Import the logo image from src/assets
import medioraLogo from "../../assets/medioralogo.png"; // Adjust the import path as needed

export default function DoctorSignin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = password.length >= 8;
  const handleGoogleLogin = () => {
    window.location.href = "https://mediora-back-2.onrender.com/auth/google";
  };
  return (
    <div className={styles.contain}>
      <div className={styles.pageFlex}>
        <div className={styles.leftFlex}>
          <div className={styles.gradientLay}></div>
          <div className={styles.picLay}></div>
          <div className={styles.infoFlex}>
            <div className={styles.logoFlex}>
              {/* Removed the border/background wrapper and added image */}
              <img 
                src={medioraLogo} 
                alt="MEDIORA" 
                style={{ height: "48px", width: "auto", objectFit: "contain" }}
              />
              <span className={styles.name}>MEDIORA</span>
            </div>
            <div className={styles.textOnPic}>
              <h1 className={styles.textHead}>
                Advanced Medical Workspace for Professionals.
              </h1>
              <p className={styles.textPara}>
                Seamlessly manage patient data, diagnostics, and clinical
                workflows in one unified enterprise platform.
              </p>
            </div>
            <div className={styles.footFlex}>
              <span>&copy;MEDIORA Global</span>
              <span className={styles.points}></span>
              <span>SYSTEM STATUS</span>
              <span className={styles.points}></span>
              <span>SECURITY PROTOCOLS</span>
            </div>
          </div>
        </div>
        <div className={styles.rightFlex}>
          <div className={styles.fullForm}>
            <div className={styles.call}>
              {/* Title now in single line with logo image inline - removed whereFlex */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "8px" }}>
                <img 
                  src={medioraLogo} 
                  alt="MEDIORA" 
                  style={{ height: "40px", width: "auto", objectFit: "contain" }}
                />
                <h2 className={styles.callHead} style={{ margin: 0 }}>Sign In to MEDIORA</h2>
              </div>
              <p className={styles.callPara}>
                Enter your credentials to access your secure portal.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login.mutate(
                  { username: email, password },
                  {
                    onSuccess: () => {
                      navigate("/request-checker");
                    },
                  },
                );
              }}
              className={styles.form}
            >
              <div className={styles.radio}>
                <div className={styles.radioGrid}>
                  <div>
                    <input
                      id="role_doctor"
                      type="radio"
                      name="role"
                      className={styles.roleSelect}
                      defaultChecked
                    />
                    <label htmlFor="role_doctor" className={styles.selectFlex}>
                      <span className={styles.selectIcon}>stethoscope</span>
                      Doctor Log in
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.emPass}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  onChange={(e) => {
                    setEmail(e.target.value);
                    login.reset();
                  }}
                  value={email}
                  type="email"
                  placeholder="yourname@domain.com"
                  className={styles.emPassInput}
                />
              </div>
              <div>
                <div className={styles.passFlex}>
                  <label className={styles.formLabel}>Security Password</label>
                  <Link to="/forgotpass" className={styles.forgot}>
                    Forgot Password?
                  </Link>
                </div>
                <div className={styles.passEyeContain}>
                  <input
                    onChange={(e) => {
                      setPassword(e.target.value);
                      login.reset();
                    }}
                    value={password}
                    type="password"
                    placeholder="••••••••"
                    className={styles.emPassInput}
                  />
                </div>
              </div>
              {login.isError &&
                (login.error?.response?.status === 401 ? (
                  <span className={`${styles.not} ${styles.errorText}`}>
                    Invalid Credentials
                  </span>
                ) : (
                  <span className={`${styles.not} ${styles.errorText}`}>
                    Please Re-check all Fields and Try Again
                  </span>
                ))}
              <button
                disabled={!isValidEmail || !isValidPassword || login.isPending}
                className={!login.isPending ? styles.continueButt : styles.load}
              >
                {!isValidEmail || !isValidPassword ? (
                  "Please Enter your Credentials"
                ) : login.isPending ? (
                  <TailSpin height="20" width="20" color="#215eed" />
                ) : (
                  "Continue "
                )}
              </button>
            </form>

            {/* NEW BEAUTIFUL DIVIDER */}
            <div className={styles.divider}>
              <span className={styles.dividerText}>or</span>
            </div>

            <div className={styles.googleGrid}>
              <button
                className={styles.googleButton}
                onClick={handleGoogleLogin}
              >
                <svg
                  className={styles.svgCl}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className={styles.googleSpan}>
                  Sign in with Google account
                </span>
              </button>
            </div>
            <div className={styles.new}>
              <p className={styles.newPara}>
                New to the platform?
                <Link to="/signup" className={styles.newLink}>
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}