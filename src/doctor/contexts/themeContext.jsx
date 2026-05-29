import { useEffect,useContext,createContext,useState } from "react";
const ThemeContext=createContext();
export default function ThemeProvider({children}){
    const [theme,setTheme]=useState(()=>{return localStorage.getItem("theme")||"light"})
    useEffect(()=>{
            localStorage.setItem("theme",theme);
            document.documentElement.setAttribute("data-theme", theme);
        },[theme])
    const toggleTheme=()=>{
        setTheme((prev)=>(
            prev==="light"? "dark":"light"
        ))
    }
    const value={theme,setTheme,toggleTheme};
    return(
        <ThemeContext.Provider value={value}>
        {children}
        </ThemeContext.Provider>
    )
};
export function useTheme(){
    const context=useContext(ThemeContext);
    if (!context){
        console.log("must be used inside a theme context provider");
    }
    return context;
    
};