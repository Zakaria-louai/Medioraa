import { useState } from "react";
import Opt from "./opt2";
import './step2.css';
import { useEffect } from "react";
import { useContext } from "react";
import { SignupContext } from "../signupContext";
export default function Signup2(){
    //const {step,nextStep,prevStep}=useContext(SignupContext);
    const [code,setCode]=useState('');
    const [timeleft,setTimeleft]=useState(59);
    const [hover,setHover]=useState(false);
    useEffect(()=>{
        if(timeleft<=0) return;
        const intervalId=setInterval(()=>{
            setTimeleft(time=>time-1);
        },1000)
        return ()=>{
            clearInterval(intervalId);
        }
    },[timeleft])
    return(<div>
        <div className="complete2Flex">
             <span className="completeStep2">Step 2 of 3:Identity Verification</span>
             <span className="completeStep2grey">66% Complete</span>
            </div>
        <div className="oneThirdFlex2">
         <div className='bar2 barColor1'></div>
         <div className='bar2 barColor2'></div>
         <div className='bar2'></div>
        </div>
        <div className="pageFlexSignUp2">
        <div className="securityFlexSignUp2">
        <div className="goBackSignUp2">
        <img className="backArrowSignUp2"src="src\signup\step2\step2Pics\arrow-sm-left-svgrepo-com.svg"></img>
        <button className="backSignUp2">Go Back</button>
        </div>
        <div className="shadowSignUp2">
        <img src="src\signup\step2\step2Pics\outlined-shield-secure-svgrepo-com (1).svg" className="securityImageSignUp2"/>
        </div>
        <span className="securityOrderSignUp2">Secure Your Account</span>
        <span className="securityGuideSignUp2">We've sent a 6-digit verification code to your registered Email.</span>
        </div>
        <form className="formSignUp2">
            <div className="smallerSignUp2">
            <span className="orderSignUp2">Enter Verification Code</span>
            <br></br>
            <span className="reqSignUp2">Please enter the security code to continue your registration.</span>
            <div>
            <Opt onComplete={v=>setCode(v)} className="OptSignUp2"/>
            </div>
            <button className="vecoSignUp2" disabled={code.length < 6}>{code.length >=6 ? "Verify and Continue":"Please Enter your Code"}</button>
            <div className="resendFlexSignUp2">
            <span>{timeleft==0? "Didn't receive the code?":""} <button className="resendSignUp2" onClick={()=>setTimeleft(59)} disabled={timeleft>0}>{timeleft==0 ? 'Resend Code' : '...'}</button></span>
            <div className="timerFlexSignUp2">
            <img className="timeImSignUp2" src={timeleft==0? "src/signup/step2/step2Pics/clock-check-svgrepo-com.svg" : "src/signup/step2/step2Pics/clock-exclamation-svgrepo-com.svg"}/>
            <span>0:{timeleft>=10 ? timeleft:`0${timeleft}`}</span>
            </div>
            </div>
            <div className="helpSignUp2">
                <span className="helpParaSignUp2">NEED HELP?</span>
                <div className="helpFlexSignUp2" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
                <span className="contactSignUp2">Constact Support Team</span>
                <img src={!hover 
  ? "src/signup/step2/step2Pics/arrow-up-right-from-square-svgrepo-com.svg"
  : "src/signup/step2/step2Pics/arrow-up-right-from-square-blue-svgrepo-com.svg"} className="helpImSignUp2"></img>
                </div>
            </div>
            </div>
        </form>
        </div>
    </div>
    )
}