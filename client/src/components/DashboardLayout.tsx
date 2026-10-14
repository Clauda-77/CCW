import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  ChevronDown,
  ClipboardList,
  FileChartColumn,
  FileText,
  LayoutDashboard,
  BarChart3,
  LogOut,
  Menu,
  PackageSearch,
  Printer,
  ScanLine,
  ShieldCheck,
  Upload,
  UsersRound,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

type NavChild = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles?: string[];
};
type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path?: string;
  roles?: string[];
  children?: NavChild[];
};

type DashboardIdentity = {
  name?: string | null;
  role?: string | null;
  warehouseName?: string | null;
};

const roleLabels: Record<string, string> = {
  admin: "مدير",
  reviewer: "مراقب مستودع",
  data_entry: "مدخل بيانات",
  warehouse_keeper: "أمين مستودع",
  user: "مستخدم",
};

const menuItems: NavItem[] = [
  {
    icon: FileText,
    label: "ملف",
    children: [{ icon: LayoutDashboard, label: "الرئيسية", path: "/" }],
  },
  {
    icon: ClipboardList,
    label: "المذكرات",
    children: [
      {
        icon: ArrowDownToLine,
        label: "مذكرة الاستلام",
        path: "/inbound",
        roles: ["data_entry", "warehouse_keeper", "reviewer", "admin"],
      },
      {
        icon: ArrowDownToLine,
        label: "مذكرة الإدخال",
        path: "/entry",
        roles: ["data_entry", "warehouse_keeper", "reviewer", "admin"],
      },
      {
        icon: ArrowUpFromLine,
        label: "مذكرة التسليم",
        path: "/outbound",
        roles: ["data_entry", "warehouse_keeper", "reviewer", "admin"],
      },
      {
        icon: FileText,
        label: "محضر تركيب وتنسيق",
        path: "/transfer",
        roles: ["data_entry", "warehouse_keeper", "reviewer", "admin"],
      },
    ],
  },
  {
    icon: Warehouse,
    label: "المستودع",
    children: [
      { icon: PackageSearch, label: "بطاقة المادة", path: "/materials" },
      {
        icon: ScanLine,
        label: "حركة المواد الشهرية",
        path: "/inventory",
        roles: ["warehouse_keeper", "reviewer", "admin"],
      },
      {
        icon: ClipboardList,
        label: "الجرد",
        path: "/reports",
        roles: ["warehouse_keeper", "reviewer", "admin"],
      },
    ],
  },
  {
    icon: Wrench,
    label: "أدوات",
    children: [
      {
        icon: Warehouse,
        label: "المستودعات والجهات",
        path: "/warehouses",
        roles: ["warehouse_keeper", "admin"],
      },
      {
        icon: Upload,
        label: "ترحيل البيانات القديمة",
        path: "/import",
        roles: ["admin"],
      },
      {
        icon: UsersRound,
        label: "إدارة المستخدمين",
        path: "/users",
        roles: ["admin"],
      },
      {
        icon: ShieldCheck,
        label: "الأدوار والصلاحيات",
        path: "/access",
        roles: ["admin"],
      },
      {
        icon: ClipboardList,
        label: "سجل الحركات الإدارية",
        path: "/admin-audit",
        roles: ["admin"],
      },
      {
        icon: BarChart3,
        label: "الإحصائيات",
        path: "/statistics",
        roles: ["warehouse_keeper", "reviewer", "admin"],
      },
    ],
  },
];

function allow(roles: string[] | undefined, role: string, preview: boolean) {
  return preview || !roles || roles.includes(role);
}

export default function DashboardLayout({
  children,
  preview = false,
}: {
  children: React.ReactNode;
  preview?: boolean;
}) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  if (loading && !preview) return <DashboardLayoutSkeleton />;
  if (!user && !preview)
    return (
      <div
        className="surface-grid flex min-h-screen items-center justify-center p-5"
        dir="rtl"
      >
        <div className="legacy-panel w-full max-w-md rounded-2xl p-8 text-center">
          <div className="legacy-hero-sky mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg">
            <Warehouse className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            نظام إدارة المستودعات
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            سجّل الدخول للوصول إلى المواد والمذكرات والتقارير حسب صلاحياتك.
          </p>
          <Button
            onClick={() => setLocation("/login")}
            size="lg"
            className="mt-7 w-full bg-[#006fba] hover:bg-[#00568f]"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );

  const identity = (user ??
    (preview ? { name: "عرض الواجهة" } : null)) as DashboardIdentity | null;
  const role = user?.role ?? "user";
  const visible = menuItems
    .map(item =>
      item.children
        ? {
            ...item,
            children: item.children.filter(child =>
              allow(child.roles, role, preview)
            ),
          }
        : item
    )
    .filter(item =>
      item.children
        ? item.children.length > 0
        : allow(item.roles, role, preview)
    );
  const navigate = (path: string) => {
    setLocation(path);
    setMenuOpen(false);
  };
  const itemActive = (item: NavItem) =>
    Boolean(
      item.path
        ? location === item.path
        : item.children?.some(child => location === child.path)
    );
  const dropdownItems = (item: NavItem) => (
    <div className="py-1">
      {item.children?.map(child => {
        const ChildIcon = child.icon;
        return (
          <DropdownMenuItem
            key={`${child.path}-${child.label}`}
            onSelect={() => navigate(child.path)}
            className="legacy-menu-command flex cursor-pointer items-center gap-2 px-3 py-2.5"
          >
            <ChildIcon className="h-4 w-4 text-[#0876ba]" />
            {child.label}
          </DropdownMenuItem>
        );
      })}
    </div>
  );

  const warehouseLabel = identity?.warehouseName ?? "";
  const roleLabel = roleLabels[identity?.role ?? ""] ?? "مستخدم";
  return (
    <div className="min-h-screen" dir="rtl">
      <header className="legacy-topbar sticky top-0 z-40">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-stretch gap-3 px-4 lg:px-7">
          <button
            onClick={() => navigate("/")}
            aria-label={`${warehouseLabel} - المستودعات`}
            title={`${warehouseLabel} - المستودعات`}
            className="flex shrink-0 items-center gap-2 py-2 text-right"
          >
            <span className="legacy-hero-sky flex h-9 w-9 items-center justify-center rounded-lg text-white shadow">
              <Warehouse className="h-5 w-5" />
            </span>
            <span className="hidden lg:block">
              <strong className="block max-w-44 truncate text-sm leading-none text-[#005892]">
                {warehouseLabel}
              </strong>
              <small className="mt-0.5 block text-[10px] font-bold text-[#5a86a2]">
                المستودعات
              </small>
            </span>
          </button>
          <nav className="legacy-menu-tabs hidden flex-1 items-stretch justify-start overflow-x-auto lg:flex">
            {visible.map(item => {
              const Icon = item.icon;
              const active = itemActive(item);
              return item.children ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-active={active}
                      className="legacy-menu-tab flex shrink-0 items-center gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                      <span className="legacy-active-dot" aria-hidden="true" />
                      <ChevronDown className="mr-0.5 h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={3}
                    className="legacy-menu-panel w-72 overflow-hidden p-0"
                  >
                    {dropdownItems(item)}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path!)}
                  data-active={active}
                  className="legacy-menu-tab flex shrink-0 items-center gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mr-auto flex items-center gap-2 py-2">
            <span
              className="hidden max-w-52 truncate rounded border border-[#a4d7ef] bg-[#effbff] px-2.5 py-1 text-[10px] font-bold text-[#16649b] xl:block"
              title={warehouseLabel}
            >
              {warehouseLabel}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-[#bfe3f4] bg-white/75 p-1.5 text-right hover:bg-white">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[#caedfc] text-xs font-bold text-[#0068ac]">
                      {identity?.name?.charAt(0) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-24 truncate text-xs font-bold text-[#24536f] md:block">
                    {identity?.name || "-"}
                  </span>
                  <span className="hidden rounded-full bg-[#e8f6ff] px-2 py-1 text-[10px] font-bold text-[#17698a] sm:inline-block">
                    {roleLabel}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user ? (
                  <div className="min-w-48 border-b border-slate-100 px-3 py-2 text-right">
                    <p className="text-sm font-bold text-slate-800">
                      {identity?.name || "مستخدم"}
                    </p>
                    <p className="mt-1 text-xs text-[#17698a]">
                      الدور: {roleLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      المستودع: {warehouseLabel || "غير محدد"}
                    </p>
                  </div>
                ) : null}
                {user ? (
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setMenuOpen(open => !open)}
              className="rounded-lg border border-[#bfe3f4] bg-white/75 p-2 lg:hidden"
              aria-label="فتح القائمة"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-[#bae2f4] bg-[#f6fdff] p-3 lg:hidden">
            <nav className="grid grid-cols-2 gap-2">
              {visible.map(item => {
                const Icon = item.icon;
                if (item.children)
                  return (
                    <div
                      key={item.label}
                      className="col-span-2 rounded-lg border border-[#bfe3f4] bg-white/70 p-2"
                    >
                      <div className="flex items-center gap-2 px-2 py-1 text-sm font-extrabold text-[#07518e]">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <div className="mt-1 grid gap-1">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          return (
                            <button
                              key={`${child.path}-${child.label}`}
                              onClick={() => navigate(child.path)}
                              className="legacy-menu-command flex items-center gap-2 rounded-md px-2 py-2 text-right"
                            >
                              <ChildIcon className="h-4 w-4" />
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                const active = itemActive(item);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path!)}
                    data-active={active}
                    className="legacy-menu-tab flex items-center gap-2 text-right"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto min-h-screen max-w-[1600px] p-4 md:p-6 lg:p-7">
        {children}
      </main>
    </div>
  );
}
