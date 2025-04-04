import React from "react";
import { Loader2 } from "lucide-react";

type CustomButtonProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: "primary" | "default";
  size?: "small" | "middle" | "large";
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  icon,
  onClick,
  loading = false,
  disabled = false,
  type = "default",
  size = "middle",
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full transition-colors cursor-pointer items-center relative border";
  const sizeStyles = {
    small: "px-2.5 py-1 text-sm",
    middle: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };
  const typeStyles = {
    default:
      "bg-white text-emerald-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400",
    primary:
      "border-gradient-cool bg-white text-emerald-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${typeStyles[type]}`}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
