import RoleSelector from '@/components/RoleSelector';

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between border-b border-stone-700 bg-stone-900 px-6 py-3">
      <span className="text-lg font-semibold tracking-wide text-amber-400">
        Adventurer&rsquo;s Food-Cart Finder
      </span>
      <RoleSelector />
    </nav>
  );
}
