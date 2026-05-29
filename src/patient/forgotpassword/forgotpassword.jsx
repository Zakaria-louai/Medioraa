import { useState } from "react";
import "./forgotpassword.css";

export default function ForgotPassword (){
    const [emailFP,setEmailFP]=useState('');
    return(
        <>
        <div className="headForgotPasswordFlex">
        <div className="logoFlexForgotPassword">
            <img src="#" className="logoPicForgotPassword"></img>
            <span className="medioraForgotPassword">MEDIORA</span>
        </div>
        <div className="othersFlexForgotPassword">
            <span className="helpCenterForgotPassword">Help Center</span>
            <button className="signInForgotPassword">Sign In</button>
        </div>
        </div>
        <div className="pageFlexForgotPassword">
            <div className="insiderForgotPassword">
        <div className="rightFlexForgotPassword">
            <div className="imageBackForgotPassword">
             <img src="#" className="rightPicForgotPassword"></img>
            </div>
            <span className="resetForgotPassword">Reset Password</span>
            <p className="resetParaForgotPassword">To regain access to your healthcare portal,please provide your registered credentials.<br></br>We will send a secure verification link to your inbox.</p>
        <div className="praiseFlexForgotPassword">
            <img src="#" className="secureIconForgotPassword"></img>
            <span className="praiseTextForgotPassword">Secure end-to-end encrypted process</span>
        </div>
        <div className="timeFlexForgotPassword">
            <img src="#" className="timeIconForgotPassword"></img>
            <span className="timeTextForgotPassword">Link valid for the next 30 minutes</span>
        </div>
        </div>
        <form className="formForgotPassword">
            <label htmlFor="emailForgotPassword" className="labelForgotPassword">Email</label>
            <input id="emailForgotPassword" type="email" value={emailFP} onChange={(e)=>setEmailFP(e.target.value)} className="emailInForgotPassword"/>
            <div className="submitFlexForgotPassword">
            <button className="submitButtForgotPassword">Send Reset Link</button>
            <img className="arrowForgotPassword" src="#"></img>
            </div>
            <div className="backSignFlexForgotBassword">
                <img className="lessForgotPassword" src="#"></img>
                <span className="backSignTextForgotPassword">Back to login screen</span>
            </div>
            <p className="seekSupportForgotPassword">Need Help? <span className="contactForgotPassword">Contact MEDIORA Support</span></p>
        </form>
        </div>
        </div>
        <div className="footFlexForgotPassword">
        <span>&copy;MEDIORA Medical Systems</span>
        <div className="lastFlexForgotPassword">
            <span className="lastForgotPassword">Privacy Policy</span>
            <span className="lastForgotPassword">Security Standards</span>
            <span className="lastForgotPassword">Terms of Service</span>
        </div>
        </div>
        </>
    )
}