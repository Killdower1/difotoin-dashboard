import * as React from "react";
export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={"h-6 w-11 rounded-full transition-colors " + (checked ? "bg-green-500" : "bg-gray-500")}
    >
      <span className={"block h-5 w-5 bg-white rounded-full transform transition-transform " + (checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}
