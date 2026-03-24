'use client';

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function InputField({
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  onFocus,
  onKeyDown,
  disabled = false,
  className
}: Readonly<{
  type?: string;
  placeholder?: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e:React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  name: string;
  disabled?:boolean;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="relative w-full flex flex-col">
      <input
        type={inputType}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        name={name}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        autoComplete="off"
        disabled={disabled}
        className={`p-2 pr-10 border rounded  focus:outline-none focus:ring-2 focus:ring-primary text-[#F0EDED] w-full ${className} ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />

      {isPassword && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeOffIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </div>
      )}

      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}


export function MultipleInputField({
  name,
  placeholder,
  value,
  rows,
  onChange,
  error,
  className
}: Readonly<{
  rows?: number;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  name:string;
  className?:string
}>) {
  return (
    <div className="flex flex-col w-full">
      
      <textarea
        rows={rows ?? 4}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        name={name}
        className={`p-2 my-auto border rounded bg-[##202020] focus:outline-none focus:ring-2 focus:ring-(--red-dark) focus:border-(--red-dark) text-[#F0EDED] w-[100%] resize-none  ${className} ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}