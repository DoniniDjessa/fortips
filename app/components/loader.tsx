"use client";

export default function Loader({ size = "sm", text }: { size?: "sm" | "md" | "lg"; text?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-[2px]",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-[4px]",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative flex items-center justify-center">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--color-falcon-primary)] border-t-transparent border-solid dark:border-[rgba(44,123,229,0.75)] dark:border-t-transparent`}
        />
        <div className="absolute h-full w-full animate-ping rounded-full border border-[rgba(44,123,229,0.32)]" />
      </div>
      {text && (
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 animate-pulse dark:text-slate-300">
          {text}
        </p>
      )}
    </div>
  );
}

