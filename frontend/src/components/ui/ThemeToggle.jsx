import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export default function ThemeToggle({ className = "", compact = false }) {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const options = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Monitor },
  ];

  const currentIcon = effectiveTheme === "dark" ? Moon : Sun;
  const CurrentIcon = currentIcon;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Cambiar tema de apariencia. Tema actual: ${theme}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <CurrentIcon className="h-4 w-4 text-brand-red dark:text-red-400" aria-hidden="true" />
        {!compact && (
          <span className="capitalize hidden sm:inline">
            {theme === "system" ? "Sistema" : theme === "dark" ? "Oscuro" : "Claro"}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label="Opciones de tema visual"
          className="absolute right-0 z-50 mt-1.5 w-36 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:ring-white/10"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                  isSelected
                    ? "bg-red-50 text-brand-red dark:bg-red-950/40 dark:text-red-400"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
