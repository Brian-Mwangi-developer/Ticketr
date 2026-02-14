import { LayoutGrid, Radio, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';

export default function BottomNav({ activePath }: { activePath: string }) {
  const navItems = [
    { label: 'Dashboard', icon: LayoutGrid, href: '/admin/dashboard' },
    { label: 'Gates', icon: Radio, href: '/admin/gate' },
    { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
    { label: 'Admin', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0a0f18]/90 backdrop-blur-xl border-t border-white/5 p-4 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 ${activePath === item.href ? 'text-blue-500' : 'text-gray-600'}`}>
          <item.icon size={20} />
          <span className="text-[8px] uppercase font-bold tracking-tighter">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}