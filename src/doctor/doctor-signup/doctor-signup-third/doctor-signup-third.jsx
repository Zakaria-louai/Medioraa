import styles from './doctor-signup-third.module.css'
import { Conditions,conditionsVerify,StrengthLabel } from '../../otp'
import { useState } from 'react'
import { useAuth } from '../../contexts/authContext';
export default function DoctorSignThird({next,prev}){
    const [coPass,setCoPass]=useState("");
    const [pass,setPass]=useState("");
    return(<div>
            <div className={styles.main}>
                <div className={styles.leftSide}>
                    <button onClick={prev} className={styles.leftBack}>
                        <span className={styles.backIcon}>arrow_back</span>
                        <span style={{fontWeight:500}}>Go Back</span>
                    </button>
                    <div>
                        <h3 className={styles.leftHead}>
                            <span className={styles.leftLogoIcon}>verified_user</span>
                            Security Guidelines
                        </h3>
                        <p className={styles.leftPara}>MEDIORA uses industry-leading end-to-end encryption. Create a strong password to protect your sensitive medical data and history.</p>
                        <Conditions password={pass}/>
                    </div>
                    <div className={styles.hIPPA}>
                        <div className={styles.iconCover}>
                            <span className={styles.hIPPAIcon}>shield_lock</span>
                        </div>
                        <div>
                            <h4 className={styles.hIPPAHeader}>HIPAA Compliant Platform</h4>
                            <p className={styles.hIPPAPara}>Your data is protected by bank-grade AES-256 encryption and compliant with federal medical privacy regulations.</p>
                        </div>
                    </div>
                </div>
                <div className={styles.rightSide}>
                    <div className={styles.formContain}>
                        <form className={styles.form}>
                            <div className={styles.inputDiv}>
                                <label className={styles.label} htmlFor='password'>
                                Create Password
                                </label>
                                <div>
                                    <input onChange={(e)=>setPass(e.target.value)} className={styles.input} placeholder='••••••••' type='password' id='password'/>
                                </div>
                                <StrengthLabel passw={pass}/>
                            </div>
                            <div className={styles.inputDiv}>
                                <label className={styles.label} htmlFor='confirm-password'>CONFIRM PASSWORD</label>
                                <div>
                                    <input onChange={(e)=>setCoPass(e.target.value)} className={styles.input} id='confirm-password' type='password' placeholder='••••••••' />
                                </div>
                            </div>
                            {(pass!==coPass && coPass) && <p className={styles.match}>Passwords must match</p>}
                            <div className={styles.infoFlex}>
                                <span className={styles.infoIcon}>info</span>
                                <p className={styles.infoPara}>Passwords are case-sensitive and must match exactly. We recommend using a unique password not used elsewhere.</p>
                            </div>
                        </form>
                    </div>
                    <div className={styles.create}>
                <button onClick={()=>{sessionStorage.setItem("password",pass);
                    next()}} className={conditionsVerify(pass) && (pass===coPass)?styles.button:styles.stop}>
                    <span>{conditionsVerify(pass) && (pass===coPass)?"Set Password and Continue":"Please Read the Instructions Again"}</span>
                    <span className={styles.nextIcon}>arrow_forward</span>
                </button>
            </div>
                </div>
            </div>
        </div>
    )
}