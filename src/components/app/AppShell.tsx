import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Gauge, Sun, Package, Droplets, KanbanSquare, Users, Trophy, Zap, Target, BadgeCheck, Building2, ListChecks, Menu, RotateCcw,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormsProvider } from "./EntityForms";
import { ProspectSheetProvider } from "./ProspectSheet";
import { resetDemo, store } from "@/state/store";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Command Center", icon: Gauge },
  { to: "/hoje", label: "Hoje", icon: Sun },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/prospects", label: "Prospects", icon: Users },
  { to: "/atividades", label: "Ações", icon: ListChecks },
  { to: "/torneiras", label: "Torneiras", icon: Droplets },
  { to: "/scoreboard", label: "Scoreboard", icon: Trophy },
  { to: "/energia", label: "Alocação de Energia", icon: Zap },
  { to: "/metas", label: "Meta de Caixa", icon: Target },
  { to: "/catalogo", label: "Catálogo", icon: Package },
  { to: "/evidencias", label: "Evidências", icon: BadgeCheck },
  { to: "/marcas", label: "Marcas", icon: Building2 },
] as const;

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-px px-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent"
          activeProps={{ className: "!bg-sidebar-accent !text-sidebar-primary font-medium" }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="px-4 py-4">
      <div className="text-[15px] font-bold tracking-tight">
        PUB<span className="text-primary">WAR</span>
      </div>
      <div className="label-xs">Command Center</div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-auto space-y-2 p-3 text-[11px] text-muted-foreground">
      <p className="rounded-md border border-info/30 bg-info/10 p-2 text-info">
        Dados <b>DEMO</b> fictícios. Salvos só neste navegador.
      </p>
      <button
        className="flex items-center gap-1.5 hover:text-foreground"
        onClick={() => {
          if (confirm("Restaurar dados DEMO? Suas alterações serão perdidas.")) {
            resetDemo();
            toast.success("Dados DEMO restaurados");
          }
        }}
      >
        <RotateCcw className="size-3" /> Restaurar dados demo
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    store.init();
    setReady(true);
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
        <Brand />
        <Nav />
        <Footer />
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="flex w-60 flex-col bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Brand />
          <Nav onNavigate={() => setMobile(false)} />
          <Footer />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
          <Button size="icon" variant="ghost" onClick={() => setMobile(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>
          <span className="font-bold">PUB<span className="text-primary">WAR</span></span>
        </div>
        <main className="mx-auto max-w-[1600px] p-3 md:p-5">
          {ready ? (
            <FormsProvider>
              <ProspectSheetProvider>{children}</ProspectSheetProvider>
            </FormsProvider>
          ) : (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-7 w-56" />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
              <Skeleton className="h-80" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
