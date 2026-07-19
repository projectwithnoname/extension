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

    useEffect(() => {
        const root = window.document.documentElement;
        
        chrome.storage.local.set({ theme });

        let activeTheme = theme;
        if (theme === "system") {
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            activeTheme = systemPrefersDark ? "dark" : "light";
        }

        root.classList.remove("light", "dark");
        root.classList.add(activeTheme);
    }, [theme]);
    
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
        context.setTheme(prev => {
            if (prev === "system") return "light";
            if (prev === "light") return "dark";
            return "system";
        });
    }

    return {theme: context.theme, setTheme: context.setTheme, toggleTheme};
}