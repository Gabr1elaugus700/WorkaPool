import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  className?: string;
  icon?: React.ReactNode;
}

export function FloatingActionButton({
  onClick,
  icon = <Plus className="w-8 h-8" />,
  ariaLabel = "Floating Action Button",
  className = "",
}: FloatingActionButtonProps) {
  return (
    <button
      className={`
        fixed z-40 
        bottom-20 md:bottom-6 right-6
        w-16 h-16 rounded-full 
        bg-[#17cf54] text-white 
        flex items-center justify-center
        shadow-lg hover:bg-[#17cf54]/90 
        transition-colors duration-300
        ${className}
      `}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 80px)' }}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      {icon}
    </button>
  );
}
