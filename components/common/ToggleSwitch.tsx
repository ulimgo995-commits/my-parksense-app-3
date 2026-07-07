interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
}

/** iOS 스타일 토글 스위치 (지도 위 컨트롤 등, 체크박스보다 눈에 띄는 on/off 표시가 필요한 곳용) */
export function ToggleSwitch({ checked, onChange, label, className = '' }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`flex items-center gap-2 ${className}`}
    >
      {label && <span className="whitespace-nowrap text-xs font-semibold text-text-primary">{label}</span>}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
