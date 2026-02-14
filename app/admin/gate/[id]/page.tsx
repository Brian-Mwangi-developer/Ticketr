// app/admin/gate/[id]/page.tsx
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Unlock, 
  Lock, 
  AlertTriangle, 
  Users, 
  Gauge, 
  TrendingUp, 
  Hourglass,
  LayoutGrid, 
  Radio, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import SensitivitySlider from '@/components/SensitivitySlider';

const VALID_GATES = ["1", "2", "3", "4"];

async function getGateData(id: string) {
  if (!VALID_GATES.includes(id)) return null;

  const gates: Record<string, any> = {
    "1": { name: "South Gate 1", entries: 5432, flow: 18, wait: 1 },
    "2": { name: "East Gate 2", entries: 8901, flow: 28, wait: 2 },
    "3": { name: "West Gate 3", entries: 3210, flow: 10, wait: 5 },
    "4": { name: "North Gate 4", entries: 14282, flow: 42, wait: 3 },
  };
  return gates[id];
}

export async function generateStaticParams() {
  return VALID_GATES.map((id) => ({ id }));
}

export default async function GateControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await getGateData(id);

  if (!gate) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto shadow-2xl transition-colors duration-300 border-x border-border">
      
      {/* --- HEADER --- */}
      <header className="p-6 flex justify-between items-center">
        <Link 
          href="/admin" 
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Security Control</p>
          <h1 className="text-xl font-bold tracking-tight">{gate.name}</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground/50 hover:text-foreground">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-6">
        
        {/* --- LIVE FEED (IMAGE + TEXT OVERLAY) --- */}
        <div className="relative aspect-video bg-muted rounded-3xl overflow-hidden border border-border group shadow-inner">
          
          {/* 1. The Image Layer */}
          <Image 
            src="/gate-feed.jpg" 
            alt="Gate Live Feed"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />

          {/* 2. The Dark Overlay (Makes text readable) */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity group-hover:opacity-40" />

          {/* 3. The "Encrypted" Text Layer */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-white/60 font-mono text-[10px] uppercase tracking-[0.3em] drop-shadow-2xl text-center px-4">
               Encrypted Feed: CAM_{id}_01
             </span>
          </div>

          {/* 4. The HUD Badges */}
          <div className="absolute top-4 left-4">
            <div className="bg-destructive px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Live</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-right">
            <p className="text-[9px] text-white/90 uppercase font-black tracking-widest drop-shadow-md">Latency</p>
            <p className="text-chart-2 text-xs font-bold font-mono tracking-tighter drop-shadow-md">120ms</p>
          </div>
        </div>

        {/* --- GATE CONTROLS --- */}
        <div className="grid grid-cols-2 gap-4">
          <button className="h-44 bg-primary text-primary-foreground rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/20 hover:opacity-90">
            <Unlock size={32} strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-widest">Gate Open</span>
          </button>
          <button className="h-44 bg-card text-muted-foreground rounded-[2rem] flex flex-col items-center justify-center gap-3 border border-border shadow-sm hover:bg-secondary/50 transition-colors">
            <Lock size={32} />
            <span className="text-[11px] font-black uppercase tracking-widest">Close Gate</span>
          </button>
        </div>

        {/* --- OVERFLOW PROTOCOL --- */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-5">
          <div className="flex gap-4 mb-4">
            <div className="w-12 h-12 bg-destructive rounded-2xl flex items-center justify-center text-white shadow-lg shadow-destructive/20">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-destructive font-black text-sm uppercase tracking-tight">Overflow Protocol</h3>
              <p className="text-[11px] text-destructive/70 font-medium italic">Activate emergency diversion</p>
            </div>
          </div>
          <button className="w-full bg-destructive text-white py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-transform active:scale-[0.98] shadow-lg shadow-destructive/10 hover:bg-destructive/90">
            Trigger Protocol
          </button>
        </div>

        <SensitivitySlider defaultValue={0.82} />

        {/* --- GATE ANALYTICS --- */}
        <div className="space-y-6 pt-4">
          <h3 className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Gate Analytics</h3>
          <AnalyticRow icon={<Users className="text-primary" />} label="Total Entries" value={gate.entries.toLocaleString()} />
          <AnalyticRow icon={<Gauge className="text-primary" />} label="Current Flow" value={gate.flow} unit="PPM" />
          <AnalyticRow icon={<TrendingUp className="text-primary" />} label="Peak Flow Time" value="20:15" color="text-chart-1" />
          <AnalyticRow icon={<Hourglass className="text-primary" />} label="Wait Estimate" value={`${gate.wait} MINS`} color="text-chart-2" />
        </div>
      </div>

      {/* --- BOTTOM NAV BAR --- */}
      <nav className="fixed bottom-0 w-full max-w-md bg-background/80 backdrop-blur-xl border-t border-border p-4 flex justify-around items-center z-50">
        <NavItem active icon={<LayoutGrid size={20} />} label="Dashboard" />
        <NavItem icon={<Radio size={20} />} label="Gates" />
        <NavItem icon={<BarChart3 size={20} />} label="Reports" />
        <NavItem icon={<Settings size={20} />} label="Admin" />
      </nav>
    </div>
  );
}

function AnalyticRow({ icon, label, value, unit, color = "text-foreground" }: any) {
  return (
    <div className="flex justify-between items-center group cursor-default">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-secondary/50 transition-colors group-hover:bg-secondary">
          {icon}
        </div>
        <span className="text-sm font-semibold text-muted-foreground/80">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold font-mono tracking-tighter ${color}`}>{value}</span>
        {unit && <span className="text-[9px] text-muted-foreground font-black uppercase">{unit}</span>}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
      {icon}
      <span className="text-[8px] uppercase font-black tracking-tighter">{label}</span>
      {active && <div className="w-1 h-1 bg-primary rounded-full" />}
    </div>
  );
}