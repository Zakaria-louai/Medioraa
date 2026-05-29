import { useEffect } from "react";
import { useRef, useState } from "react";
import './opt2.css'
export default function Opt({length=6,onComplete}){
    const [values,setValues]=useState(Array(length).fill(""));
    const inputRef=useRef([]);
    const handleOptChange = ((e,index)=>{
        if(!/^\d?$/.test(e.target.value)) return;
        const value=e.target.value;
        const newValues=[...values];
        newValues[index]=value;
        setValues(newValues);
        if (value && index < length-1) {
            inputRef.current[index+1].focus();
        }
        if (newValues.every(v=>v !=="")){
            onComplete?.(newValues.join(""));
        }
        
    })
    const handleBack=(e,index)=>{
        if (e.key==="Backspace" && !values[index] && index>0){
            inputRef.current[index-1].focus();
        }
    }
    return(
        <div className="optinFlex">
            {values.map((v,i)=>(
                <input className="otpInput" ref={el=>inputRef.current[i]=el} key={i} value={v} onChange={(e)=>handleOptChange(e,i)} onKeyDown={(e)=>handleBack(e,i)} maxLength={1} inputMode="numeric" />
            ))}
        </div>
    )
};