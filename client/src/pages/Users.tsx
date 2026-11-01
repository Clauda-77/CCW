import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Clock3,
  Pencil,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type WarehouseRole =
  | "user"
  | "warehouse_keeper"
  | "data_entry"
  | "reviewer"
  | "admin";
type EditableUser = {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  hasLocalPassword: boolean;
  role: WarehouseRole;
  warehouseId: number | null;
  warehouseIds: number[];
  warehouseNames: string[];
};

const roleMeta: Record<
  WarehouseRole,
  { label: string; hint: string; className: string }
> = {
  admin: {
    label: "مدير",
    hint: "إدارة كاملة للنظام والمستخدمين",
    className: "bg-[#e7f3ff] text-[#075e9c]",
  },
  reviewer: {
    label: "مراجع",
    hint: "مراجعة واعتماد المذكرات ضمن المستودعات المسندة",
    className: "bg-[#f1edff] text-[#6544a5]",
  },
  data_entry: {
    label: "مدخل بيانات",
    hint: "إنشاء مسودات المذكرات ضمن المستودعات المسندة",
    className: "bg-[#e9f8f4] text-[#14705e]",
  },
  warehouse_keeper: {
    label: "أمين مستودع",
    hint: "إدارة الحركات وإنشاء المذكرات ضمن مستودعاته",
    className: "bg-[#fff3e4] text-[#a75a13]",
  },
  user: {
    label: "قراءة فقط",
    hint: "عرض المعلومات المسموح بها دون تعديل",
    className: "bg-slate-100 text-slate-600",
  },
};

const formatDate = (value: Date | string | null) =>
  value
    ? new Intl.DateTimeFormat("ar-SY", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

type WarehouseOption = { id: number; code: string; name: string; isActive: boolean };

function WarehouseAssignmentPicker({
  warehouses,
  selectedIds,
  onChange,
  disabled = false,
}: {
  warehouses: WarehouseOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
      {warehouses.map(warehouse => {
        const selected = selectedIds.includes(warehouse.id);
        const optionDisabled = disabled || (!warehouse.isActive && !selected);
        return (
          <label
            key={warehouse.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 ${optionDisabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={optionDisabled}
              onChange={event =>
                onChange(
                  event.target.checked
                    ? [...selectedIds, warehouse.id]
                    : selectedIds.filter(id => id !== warehouse.id)
                )
              }
            />
            <span>
              {warehouse.name}{!warehouse.isActive ? " (غير نشط)" : ""}
            </span>
            <span className="mr-auto text-xs text-slate-400">{warehouse.code}</span>
          </label>
        );
      })}
      {warehouses.length === 0 && (
        <p className="p-3 text-xs text-muted-foreground">لا توجد مستودعات نشطة.</p>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { isAuthenticated, user } = useAuth();
  const isDevelopment = import.meta.env.DEV;
  const isAdmin = isDevelopment || user?.role === "admin";
  const liveQuery = trpc.users.list.useQuery(undefined, {
    enabled: isAuthenticated && isAdmin && !isDevelopment,
  });
  const previewQuery = trpc.users.previewList.useQuery(undefined, {
    enabled: isDevelopment,
  });
  const liveWarehouses = trpc.entities.listWarehouses.useQuery(
    { limit: 500 },
    { enabled: isAuthenticated && isAdmin && !isDevelopment }
  );
  const previewWarehouses = trpc.entities.previewListWarehouses.useQuery(
    { limit: 500 },
    { enabled: isDevelopment }
  );
  const query = isDevelopment ? previewQuery : liveQuery;
  const warehouseQuery = isDevelopment ? previewWarehouses : liveWarehouses;
  const activeWarehouses = (warehouseQuery.data ?? []).filter(
    warehouse => warehouse.isActive
  );
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<EditableUser | null>(null);
  const [nextRole, setNextRole] = useState<WarehouseRole>("data_entry");
  const [nextWarehouseIds, setNextWarehouseIds] = useState<number[]>([]);
  const [editUsername, setEditUsername] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<WarehouseRole>("data_entry");
  const [newWarehouseIds, setNewWarehouseIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const logout = trpc.auth.logout.useMutation();
  const updateAccess = trpc.users.updateAccess.useMutation({
    onSuccess: async result => {
      await utils.users.list.invalidate();
      await utils.users.previewList.invalidate();
      const updatedSelf = editing?.id === user?.id;
      setEditing(null);
      setResetPassword("");
      if (updatedSelf && result.passwordChanged) {
        await logout.mutateAsync();
        toast.success("تم تحديث بيانات دخولك. سجّل الدخول بكلمة المرور الجديدة.");
        window.location.assign("/login");
        return;
      }
      toast.success("تم حفظ بيانات المستخدم وصلاحياته.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ بيانات المستخدم."),
  });
  const createUser = trpc.users.create.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
      await utils.users.previewList.invalidate();
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewUsername("");
      setNewPassword("");
      setNewRole("data_entry");
      setNewWarehouseIds([]);
      toast.success("تمت إضافة المستخدم.");
    },
    onError: error => toast.error(error.message || "تعذر إضافة المستخدم."),
  });

  const openRoleEditor = (entry: EditableUser) => {
    setEditing(entry);
    setNextRole(entry.role);
    setNextWarehouseIds(entry.warehouseIds ?? []);
    setEditUsername(entry.username ?? "");
    setResetPassword("");
  };
  const allRows = query.data ?? [];
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return allRows;
    return allRows.filter(entry =>
      [
        entry.name,
        entry.email,
        entry.loginMethod,
        entry.username,
        entry.warehouseName,
        ...(entry.warehouseNames ?? []),
        roleMeta[entry.role as WarehouseRole]?.label,
        String(entry.id),
      ].some(value =>
        String(value ?? "")
          .toLocaleLowerCase()
          .includes(term)
      )
    );
  }, [allRows, search]);

  if (!isDevelopment && (!isAuthenticated || !isAdmin))
    return (
      <div className="mx-auto max-w-3xl py-14 text-center" dir="rtl">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#3284ae]" />
        <h1 className="mt-4 text-2xl font-extrabold">
          إدارة المستخدمين للمدير فقط
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          سجّل الدخول بحساب مدير لعرض المستخدمين وإسناد الأدوار.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1480px] space-y-6" dir="rtl">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#17698a]">إدارة النظام</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            المستخدمون والأدوار
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            حدد دور كل مستخدم والمستودع الذي يعمل فيه، وستظهر معلوماته في
            القائمة والشريط العلوي.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-[#bee4f5] bg-[#eefaff] px-4 py-3 text-sm font-bold text-[#17698a]">
            <UsersRound className="ml-2 inline h-4 w-4" />
            {rows.length} مستخدمًا ظاهرًا
          </div>
          {isAdmin && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-[#17698a] hover:bg-[#125875]"
            >
              <UserPlus className="ml-2 h-4 w-4" />
              مستخدم جديد
            </Button>
          )}
        </div>
      </section>
      <Card className="soft-shadow border-white/75 bg-white/85">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-10 rounded-xl pr-9"
                placeholder="ابحث بالاسم أو اسم الدخول أو البريد أو الدور أو المستودعات"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {rows.length} من {allRows.length}
            </div>
          </div>
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#c9eaf7] bg-[#f4fcff] p-4 text-sm text-[#145f88]">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              إضافة الحسابات وإدارة الصلاحيات متاحة للمدير فقط. يمكن للمدير إعداد
              بيانات دخوله، لكن لا يمكنه تغيير دوره أو مستودعاته بنفسه.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-right">
              <thead className="border-y border-slate-100 bg-slate-50/80 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">المستخدم</th>
                  <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                  <th className="px-4 py-3 font-medium">اسم الدخول</th>
                  <th className="px-4 py-3 font-medium">طريقة الدخول</th>
                  <th className="px-4 py-3 font-medium">الدور</th>
                  <th className="px-4 py-3 font-medium">المستودعات المسندة</th>
                  <th className="px-4 py-3 font-medium">آخر دخول</th>
                  <th className="px-4 py-3 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      جار تحميل المستخدمين…
                    </td>
                  </tr>
                )}
                {query.isError && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-destructive"
                    >
                      تعذر تحميل المستخدمين.
                    </td>
                  </tr>
                )}
                {!query.isLoading && !query.isError && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      لا يوجد مستخدمون بعد. سيظهر المستخدم هنا عند دخوله للحساب
                      المعتمد لأول مرة.
                    </td>
                  </tr>
                )}
                {rows.map(entry => {
                  const meta =
                    roleMeta[entry.role as WarehouseRole] || roleMeta.user;
                  const canEdit = isAdmin;
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 text-sm"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold">
                          {entry.name || "مستخدم بلا اسم"}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          #{entry.id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {entry.email || "—"}
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-700">
                        {entry.username || "غير مهيأ"}
                        <p className="mt-1 font-sans text-[11px] text-slate-400">
                          {entry.hasLocalPassword ? "كلمة مرور مهيأة" : "لم تُضبط كلمة مرور"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {entry.loginMethod || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          className={`border-0 ${meta.className}`}
                          title={meta.hint}
                        >
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#17698a]">
                        {entry.role === "admin"
                          ? "جميع المستودعات"
                          : entry.warehouseNames?.length
                            ? entry.warehouseNames.join("، ")
                            : "غير مسند — يتطلب ربطًا"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDate(entry.lastSignedIn)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canEdit}
                          onClick={() => openRoleEditor(entry)}
                          className="gap-1.5"
                        >
                          <Pencil className="h-4 w-4" />
                          إدارة الحساب والصلاحيات
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة مستخدم جديد</DialogTitle>
            <DialogDescription className="text-right">
              عيّن الدور والمستودع المخصص لهذا المستخدم قبل الحفظ.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 pt-2"
            onSubmit={event => {
              event.preventDefault();
              if (newRole !== "admin" && newWarehouseIds.length === 0) {
                toast.error("اختر مستودعًا واحدًا على الأقل لهذا الدور.");
                return;
              }
              createUser.mutate({
                name: newName,
                email: newEmail,
                username: newUsername,
                password: newPassword,
                role: newRole,
                warehouseIds: newWarehouseIds,
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="new-user-name">الاسم الكامل</Label>
              <Input
                id="new-user-name"
                required
                minLength={2}
                value={newName}
                onChange={event => setNewName(event.target.value)}
                placeholder="مثل: نهاد ميكائيل"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-email">
                البريد الإلكتروني (اختياري)
              </Label>
              <Input
                id="new-user-email"
                type="email"
                value={newEmail}
                onChange={event => setNewEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-username">اسم الدخول</Label>
              <Input
                id="new-user-username"
                required
                minLength={3}
                maxLength={64}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={newUsername}
                onChange={event => setNewUsername(event.target.value)}
                placeholder="أحرف أو أرقام، دون مسافات"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-password">كلمة المرور الأولية</Label>
              <Input
                id="new-user-password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="12 محرفًا على الأقل"
              />
              <p className="text-xs text-muted-foreground">تُحفظ مجزأة، ولا يمكن عرضها لاحقًا؛ استخدم إعادة التعيين عند الحاجة.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-role">الدور</Label>
              <Select
                value={newRole}
                onValueChange={value => setNewRole(value as WarehouseRole)}
              >
                <SelectTrigger id="new-user-role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {(Object.keys(roleMeta) as WarehouseRole[]).map(role => (
                    <SelectItem key={role} value={role}>
                      {roleMeta[role].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>المستودعات المسندة</Label>
              <WarehouseAssignmentPicker
                warehouses={activeWarehouses}
                selectedIds={newWarehouseIds}
                onChange={setNewWarehouseIds}
              />
              {newRole === "admin" ? (
                <p className="text-xs text-muted-foreground">المدير يصل إلى جميع المستودعات حتى دون إسناد فردي.</p>
              ) : (
                <p className="text-xs text-muted-foreground">اختر مستودعًا واحدًا أو أكثر؛ لا يمكن لهذا الدور العمل دون إسناد.</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={
                createUser.isPending ||
                warehouseQuery.isLoading ||
                (newRole !== "admin" && activeWarehouses.length === 0)
              }
              className="rounded-xl bg-[#17698a] hover:bg-[#125875]"
            >
              {createUser.isPending ? "جار الحفظ…" : "إضافة المستخدم"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={open => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              تعديل المستخدم
            </DialogTitle>
            <DialogDescription className="text-right">
              {editing?.name || editing?.email || "المستخدم"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-user-username">اسم الدخول</Label>
              <Input
                id="edit-user-username"
                required
                minLength={3}
                maxLength={64}
                autoComplete="username"
                value={editUsername}
                onChange={event => setEditUsername(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-password">كلمة مرور جديدة (اختياري)</Label>
              <Input
                id="edit-user-password"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={resetPassword}
                onChange={event => setResetPassword(event.target.value)}
                placeholder="اتركها فارغة للإبقاء على الحالية"
              />
              {resetPassword.length > 0 && resetPassword.length < 12 ? (
                <p className="text-xs font-semibold text-destructive">
                  كلمة المرور الجديدة يجب أن تكون 12 محرفًا على الأقل، أو اترك الحقل فارغًا للإبقاء على الحالية.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">إدخال كلمة مرور هنا يعيد تعيينها ويلغي الجلسات السابقة لهذا الحساب.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-role">الدور</Label>
              <Select
                value={nextRole}
                onValueChange={value => setNextRole(value as WarehouseRole)}
                disabled={editing?.id === user?.id}
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {(Object.keys(roleMeta) as WarehouseRole[]).map(role => (
                    <SelectItem key={role} value={role}>
                      {roleMeta[role].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">
              {roleMeta[nextRole].hint}
            </p>
            <div className="grid gap-2">
              <Label>المستودعات المسندة</Label>
              <WarehouseAssignmentPicker
                warehouses={warehouseQuery.data ?? []}
                selectedIds={nextWarehouseIds}
                onChange={setNextWarehouseIds}
                disabled={editing?.id === user?.id}
              />
              {nextRole === "admin" ? (
                <p className="text-xs text-muted-foreground">المدير يصل إلى جميع المستودعات.</p>
              ) : (
                <p className="text-xs text-muted-foreground">اختر مستودعًا واحدًا أو أكثر.</p>
              )}
            </div>
            <Button
              onClick={() => {
                if (!editing) return;
                if (nextRole !== "admin" && nextWarehouseIds.length === 0) {
                  toast.error("اختر مستودعًا واحدًا على الأقل لهذا الدور.");
                  return;
                }
                if (!editUsername.trim()) {
                  toast.error("أدخل اسم الدخول.");
                  return;
                }
                if (resetPassword.length > 0 && resetPassword.length < 12) {
                  toast.error("كلمة المرور الجديدة يجب أن تكون 12 محرفًا على الأقل.");
                  return;
                }
                updateAccess.mutate({
                  id: editing.id,
                  username: editUsername,
                  password: resetPassword || undefined,
                  role: nextRole,
                  warehouseIds: nextWarehouseIds,
                });
              }}
              disabled={
                updateAccess.isPending ||
                warehouseQuery.isLoading ||
                (resetPassword.length > 0 && resetPassword.length < 12)
              }
              className="rounded-xl bg-[#17698a] hover:bg-[#125875]"
            >
              {updateAccess.isPending
                ? "جار الحفظ…"
                : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
