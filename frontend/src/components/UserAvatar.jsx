export const UserAvatar = ({ username, className = 'w-10 h-10' }) => {
  const initials = (username || '?')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

  return (
    <div
      className={`${className} rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      <span className="text-sm font-bold text-cyan-800 dark:text-cyan-200">{initials}</span>
    </div>
  );
};
