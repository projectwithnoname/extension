import { createContext, useState, useContext, useEffect } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";


type Theme = "system" | "dark" | "light";

interface ThemeContextValue {
    theme: Theme;
    setTheme: Dispatch<SetStateAction<Theme>>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);


export const ThemeProvider = ({children}:{ children: ReactNode }) => {

    const [theme, setTheme] = useState<Theme>("system");

    useEffect(() => {
        const storedTheme = async () => {
            const result = await chrome.storage.local.get("theme");
            if(result.theme) {

                if (result.theme === "dark" || result.theme === "light" || result.theme === "system") {
                    setTheme(result.theme);
                }            
            }
            console.log("Current theme:", result.theme);

        }
        storedTheme();
    }, []);
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if(!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    const toggleTheme = () => {
        context.setTheme(prev => (prev === "dark" ? "light" : "dark"));
    }

    return {theme: context.theme, setTheme: context.setTheme, toggleTheme};
}