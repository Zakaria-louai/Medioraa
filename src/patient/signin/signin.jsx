import { useState } from 'react';
import './signin.css';
import { Link } from 'react-router';
export default function SignIn(){
    const [role,setRole]=useState('patientlogin');
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const [keep,setKeep]=useState(false);
    return(
        <>
        <div className="pageFlex">
    <div className="signinIm">
        <div className="cont">
    <div className="medFlex">
    <span></span>
    <h2>Mediora</h2>
    </div>
    <div>
    <h1>Advanced Medical Workspace for Professionals.</h1>
    <p>Seamlessly manage patient data,diagnostics and clinical workflows in one unified enterprise platform.</p>
    </div>
    <footer className="footFlex">
        <a to='#' className='foot'>&copy; 2026 MEDIORA GLOBAL</a>
        <a to='#' className='foot'> .SYSTEM STATUS</a>
        <a to='#' className='foot'> .SECURITY PROTOCOLS</a>
    </footer>
    </div>
    </div>
    <div className="order">
    <div className="signinForm">
    <form>
        <h2 className="hero">Sign in to Mediora</h2>
        <p className='p1'>Enter your credentials to access your secure portal.</p>
        <fieldset className='covRoles'>
            <legend>Select Access Role</legend>
            <div className="roles">
            <label htmlFor='patientLo' className="patientLoButt">
                <input type="radio" id="patientLo" name="role" value="patientlogin" checked={role==="patientlogin"} className='patdocRadio' onChange={(e)=>{setRole(e.target.value)}}/>
                <img src="src\signin\signinPics\118174.png" className='patIcon'></img>
                <span>Patient Login</span>
            </label>
            <label htmlFor='doctorLo' className="doctorLoButt">
                <input type="radio" id="doctorLo" name="role" value="doctorlogin" checked={role==="doctorlogin"} className='patdocRadio' onChange={(e)=>{setRole(e.target.value)}}/>
                <img src='src\signin\signinPics\icons8-stethoscope-32.png' className='docIcon'/>
                <span>Doctor Login</span>
            </label>
            </div>
        </fieldset>
        <fieldset className="emailWrap">
            <legend>Email Address</legend>
        <label htmlFor='emailAddress' >
        <input type="email" id="emailAddress" placeholder='yourname@domain.com' className="email" value={email} onChange={(e)=>{setEmail(e.target.value)}} />
        </label>
        </fieldset>
        <fieldset className="passwordWrap">
            <div className="passwordFlex">
            <span className="passAlign">Security Password</span>
            <span className="forgAlign">Forgot Password?</span>
            </div>
        <label htmlFor='securitypassword' >
        <input type="password" id="securitypassword" placeholder='......' className="password" value={password} onChange={(e)=>{setPassword(e.target.value)}} />
        </label>
        </fieldset>
        <fieldset className="keep">
        <label htmlFor='keepSign' className="keepFlex">
        <input type="checkbox" id="keepSign" onClick={()=>setKeep(!keep)} className="keepCheck"/>
        <span className='check'></span>
        <span>Keep me signed in for this session</span>
        </label>
        </fieldset>
        <div className="ord">
        <a href='#' className='go'>Continue to Dashboard</a>
        </div>
        <div className='lineFlex'>
            <span>SINGLE SIGN-ON</span>
        </div>
        <a href='#' className='google'>
        <img src="src\signin\signinPics\google-logo-png-google-icon-logo-png-transparent-svg-vector-bie-supply-14.png" className="goo"/>
        <span className='other'>Sign in with Google Account</span>
        </a>
        <div className="callFlex"><span>Don't have an account?</span><span className="call">Sign Up</span></div>
    </form>
    </div>
    </div>
    </div>
        </>
    )
}