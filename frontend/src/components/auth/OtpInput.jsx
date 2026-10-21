import { useRef } from "react";

export default function OtpInput({ value = "", onChange, disabled = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");
  const update = (index, digit) => {
    const next = [...digits];
    next[index] = digit.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (next[index] && index < 5) refs.current[index + 1]?.focus();
  };
  const paste = (event) => {
    const code = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!code) return;
    event.preventDefault();
    onChange(code);
    refs.current[Math.min(code.length, 6) - 1]?.focus();
  };
  return <fieldset disabled={disabled}>
    <legend className="mb-2 text-sm font-medium text-slate-700">Código de verificación</legend>
    <div className="flex justify-between gap-2" onPaste={paste}>
      {digits.map((digit, index) => <input
        key={index}
        ref={(element) => { refs.current[index] = element; }}
        aria-label={`Dígito ${index + 1} de 6`}
        inputMode="numeric"
        autoComplete={index === 0 ? "one-time-code" : "off"}
        value={digit}
        onChange={(event) => update(index, event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Backspace" && !digit && index > 0) refs.current[index - 1]?.focus();
          if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
          if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
        }}
        className="h-12 w-11 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-brand-navy focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 sm:h-14 sm:w-12"
        maxLength={1}
      />)}
    </div>
  </fieldset>;
}
