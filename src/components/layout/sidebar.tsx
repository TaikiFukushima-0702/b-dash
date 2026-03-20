import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "ダッシュボード" },
  { to: "/projects", icon: FolderKanban, label: "案件一覧" },
];

export function Sidebar() {
  return (
    <aside className="w-60 border-r bg-sidebar-background min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold px-2">b→dash</h1>
        <p className="text-xs text-muted-foreground px-2">CS案件管理</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
