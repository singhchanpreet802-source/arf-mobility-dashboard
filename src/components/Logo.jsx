export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { img: 'w-8 h-8', name: 'text-base', tag: 'text-[10px]' },
    md: { img: 'w-10 h-10', name: 'text-xl', tag: 'text-xs' },
    lg: { img: 'w-14 h-14', name: 'text-3xl', tag: 'text-sm' },
  }[size];

  return (
    <div className="flex items-center gap-3">
      <img
        src="/arf-logo.png"
        alt="ARF Logo"
        className={`${sizes.img} object-contain`}
      />
      <div className="text-left leading-tight">
        <div className={`${sizes.name} font-bold text-arf-navy`}>ARF Mobility Dashboard</div>
        <div className={`${sizes.tag} text-gray-500`}>Aneja Research Foundation | Bareilly, U.P.</div>
      </div>
    </div>
  );
}
