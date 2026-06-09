export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { box: 'w-8 h-8 text-sm', name: 'text-base', tag: 'text-[10px]' },
    md: { box: 'w-10 h-10 text-base', name: 'text-xl', tag: 'text-xs' },
    lg: { box: 'w-14 h-14 text-xl', name: 'text-3xl', tag: 'text-sm' },
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes.box} rounded-md bg-arf-navy text-white font-bold flex items-center justify-center`}>
        ARF
      </div>
      <div className="text-left leading-tight">
        <div className={`${sizes.name} font-bold text-arf-navy`}>ARF Mobility Dashboard</div>
        <div className={`${sizes.tag} text-gray-500`}>Aneja Research Foundation | Bareilly, U.P.</div>
      </div>
    </div>
  );
}
