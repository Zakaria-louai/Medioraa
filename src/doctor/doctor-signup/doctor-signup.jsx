import { useEffect, useState } from 'react'
import styles from './doctor-signup.module.css'
import DoctorSignFirst from './doctor-signup-first/doctor-signup-first';
import { useTheme } from '../contexts/themeContext';
import DoctorSignSecond from './doctor-signup-second/doctor-signup-second';
import DoctorSignThird from './doctor-signup-third/doctor-signup-third';
import { Link } from 'react-router';
export default function DoctorSignUp(){
    const {theme,toggleTheme}=useTheme();
    const [step,setStep]=useState(Number(sessionStorage.getItem("currentStep")||1));
    const totalSteps=3;
    const progress=(step/totalSteps)*100;
     useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    sessionStorage.setItem("currentStep",step)
  }, [step]);

    const next=()=>{
        setStep(n=>n+1);
    }
    const prev=()=>{
        setStep(n=>n-1);
    }
    const stepsComponents = [
  <DoctorSignSecond key={"step_1"} next={next} />,
  <DoctorSignThird key={"step_2"} next={next} prev={prev} />,
  <DoctorSignFirst key={"step_3"} setStep={setStep} />,
];
    return(
    <div className={styles.contain}>
    <header className={styles.header}>
                    <div className={styles.headerFlex}>
                        <div className={styles.logoFlex}>
                            <span className={styles.icon}>medical_services</span>
                            <h1 className={styles.med}>MEDIORA</h1>
                        </div>
                        <div className={styles.signFlex}>
                            <button onClick={toggleTheme} className={styles.themeButt}>
                                <span className={styles.theme}>{theme==="light"? 'light_mode':'dark_mode'}</span>
                                </button>
                            <a className={styles.helpCenter} href="#">Help Center</a>
                            <Link onClick={()=>{
                                sessionStorage.removeItem("current"),
                                setStep(1)}} to="/signin" className={styles.signIn}>Sign In</Link>
                        </div>
                    </div>
    </header>
    <div className={styles.progress}>
        <div className={styles.progressStep}>
            <span className={styles.progressStepItem1}>Step {step} of 3</span>
            <span className={styles.progressStepItem2}>{step===1? "PROFILE COMPLETION":step===2? "SECURITY VERIFICATION":"CREATE PASSWORD"}</span>
        </div>
        <div className={styles.progressContain}>
            <div className={styles.progressBar} style={{width:`${progress}%`}}></div>
        </div>
        <div className={styles.progressPoints}>
            <div className={styles.progressPoint}>
                <span className={step===1? styles.progressOn:styles.progressOff}>EMAIL VERIFICATION</span>
            </div>
            <div className={styles.progressPoint}>
                <span className={step===2? styles.progressOn:styles.progressOff}>PASSWORD</span>
            </div>
            <div className={styles.progressPoint}>
                <span className={step===3? styles.progressOn:styles.progressOff}>INFO & DOCS</span>
            </div>
        </div>
    </div>
        {stepsComponents[step - 1]}
    <footer className={styles.footer}>
                <div className={styles.footerFlex}>
                    <p className={styles.footerPara}>
                        &copy; 2026 MEDIORA Medical Systems.HIPAA compliant &amp; SOC2 Type II Certified.
                    </p>
                    <div className={styles.footerNotes}>
                        <a className={styles.footerA} href="#">Privacy Policy</a>
                        <a className={styles.footerA} href="#">Security Standards</a>
                        <a className={styles.footerA} href="#">Terms of Service</a>
                    </div>
                </div>
    </footer>
    </div>)
}