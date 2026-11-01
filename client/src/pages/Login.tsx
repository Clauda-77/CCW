import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const capabilities = [
  "المواد والأرصدة",
  "مذكرات الإدخال والإخراج",
  "التقارير الرسمية",
];

const roleLabels: Record<string, string> = {
  admin: "مدير",
  reviewer: "مراجع",
  data_entry: "مدخل بيانات",
  warehouse_keeper: "أمين مستودع",
  user: "مستخدم",
};

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [devUserId, setDevUserId] = useState("");
  const [devWarehouseId, setDevWarehouseId] = useState("");
  const isLocalDev = import.meta.env.DEV;
  const utils = trpc.useUtils();
  const localUsers = trpc.users.previewList.useQuery(undefined, {
    enabled: isLocalDev,
  });
  const localWarehouses = trpc.auth.loginWarehouses.useQuery();
  const selectedLocalUser = (localUsers.data ?? []).find(
    entry => entry.id === Number(devUserId)
  );
  const availableWarehouses = (localWarehouses.data ?? []).filter(
    warehouse =>
      selectedLocalUser?.role === "admin" ||
      (selectedLocalUser?.warehouseIds ?? []).includes(warehouse.id)
  );
  const passwordLogin = trpc.auth.passwordLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل الدخول.");
      setLocation("/");
    },
    onError: error => toast.error(error.message || "تعذر تسجيل الدخول."),
  });
  const localLogin = trpc.auth.localLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل الدخول.");
      setLocation("/");
    },
    onError: error => toast.error(error.message || "تعذر تسجيل الدخول."),
  });

  return (
    <main
      dir="rtl"
      className="legacy-login-shell relative min-h-screen overflow-hidden px-4 py-4 text-[#173c61] sm:px-8"
    >
      <div className="legacy-login-menubar mx-auto flex max-w-[1500px] items-center justify-between border-b border-[#6ca7c2] bg-white/95 px-4 py-2 text-xs font-extrabold text-[#264f6a] shadow-sm">
        <div className="flex items-center gap-5">
          <span>ملف</span>
          <span>المذكرات</span>
          <span>المستودع</span>
          <span>أدوات</span>
        </div>
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-[#0874bc]" />
          المستودعات
        </div>
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-[1400px] items-center justify-center py-8">
        <section className="legacy-login-window w-full overflow-hidden border border-[#6ca9c5] bg-white shadow-[0_24px_55px_rgba(28,82,124,0.3)]">
          <div className="flex h-9 items-center justify-between border-b border-[#7eaec4] bg-gradient-to-l from-[#d4e9f5] via-[#bdddef] to-[#edf8fd] px-4 text-xs font-extrabold text-[#174b6a]">
            <span>نظام إدارة المستودعات — تسجيل الدخول</span>
            <span className="text-lg leading-none text-[#477695]">×</span>
          </div>
          <div className="grid lg:grid-cols-[1.25fr_.75fr]">
            <section className="legacy-old-hero relative min-h-[440px] overflow-hidden p-8 text-white sm:p-12">
              <div
                className="legacy-chart-bars absolute bottom-0 left-0 h-[80%] w-[70%] opacity-95"
                aria-hidden="true"
              >
                <span className="legacy-chart-bar h-[94%]" />
                <span className="legacy-chart-bar h-[78%]" />
                <span className="legacy-chart-bar h-[88%]" />
                <span className="legacy-chart-bar h-[66%]" />
                <span className="legacy-chart-bar h-[82%]" />
              </div>
              <div className="legacy-hero-wave absolute inset-0" />
              <div className="absolute bottom-[28%] left-[23%] h-1.5 w-[30%] rotate-[-22deg] bg-[#f28a13] shadow-[0_0_12px_white]" />
              <div className="relative z-10 flex min-h-[360px] flex-col justify-between">
                <div>
                  <p className="text-lg font-extrabold text-white">
                    المستودعات
                  </p>
                  <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                    إدارة المستودعات
                  </h1>
                  <p className="mt-6 max-w-xl text-base font-bold leading-8 text-white">
                    إدارة المواد والعمليات اليومية
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {capabilities.map(capability => (
                    <div
                      key={capability}
                      className="rounded-lg border border-white/35 bg-white/15 px-3 py-3 text-center text-xs font-bold backdrop-blur-sm"
                    >
                      {capability}
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="bg-[linear-gradient(180deg,#fff,#f2fbff)] p-8 sm:p-12">
              <div className="mx-auto max-w-sm">
                <div className="flex items-center gap-3 border-b border-[#a8cfdf] pb-5">
                  <span className="grid h-12 w-12 place-items-center border border-[#9dcbe6] bg-[#e8f6ff] text-[#0874bc]">
                    <LockKeyhole className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#2879a6]">
                      البوابة المعتمدة
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[#123f63]">
                      تسجيل الدخول
                    </h2>
                  </div>
                </div>
                <p className="mt-6 text-sm leading-7 text-[#52738c]">
                  أدخل اسم المستخدم وكلمة المرور، ثم اختر أحد المستودعات المسندة
                  إلى حسابك.
                </p>
                {isAuthenticated ? (
                  <div className="mt-7 border border-[#9fd2e9] bg-[#ecfaff] p-4 text-sm text-[#17698a]">
                    <div className="flex items-center gap-2 font-extrabold">
                      <UserRoundCheck className="h-4 w-4" />
                      مرحبًا {user?.name || "بك"}
                    </div>
                    <p className="mt-1">الجلسة الحالية مفعّلة.</p>
                  </div>
                ) : (
                  <>
                    <form
                      className="mt-5 space-y-3 border-t border-[#d3e6f2] pt-5"
                      onSubmit={event => {
                        event.preventDefault();
                        passwordLogin.mutate({
                          username,
                          password,
                          warehouseId: Number(warehouseId),
                        });
                      }}
                    >
                      <Input
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        placeholder="اسم المستخدم"
                        aria-label="اسم المستخدم"
                        autoComplete="username"
                        required
                        minLength={3}
                        maxLength={64}
                      />
                      <Input
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder="كلمة المرور"
                        aria-label="كلمة المرور"
                        autoComplete="current-password"
                        required
                      />
                      <select
                        value={warehouseId}
                        onChange={event => setWarehouseId(event.target.value)}
                        aria-label="المستودع"
                        required
                        disabled={localWarehouses.isLoading}
                        className="h-10 w-full rounded-md border border-[#b9d8e8] bg-white px-3 text-sm text-[#173c61] outline-none focus:ring-2 focus:ring-[#87c9e9]"
                      >
                        <option value="">
                          {localWarehouses.isLoading
                            ? "جار تحميل المستودعات…"
                            : "اختر المستودع"}
                        </option>
                        {(localWarehouses.data ?? []).map(warehouse => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} — {warehouse.code}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="submit"
                        disabled={
                          passwordLogin.isPending ||
                          !username.trim() ||
                          !password ||
                          !warehouseId ||
                          localWarehouses.isLoading
                        }
                        className="h-10 w-full rounded-sm bg-[#0874bc] text-white hover:bg-[#075f9a]"
                      >
                        {passwordLogin.isPending
                          ? "جارٍ تسجيل الدخول…"
                          : "تسجيل الدخول"}
                      </Button>
                    </form>
                    {isLocalDev && (
                      <details className="mt-5 border-t border-dashed border-[#b9d8e8] pt-4">
                        <summary className="cursor-pointer text-xs font-bold text-[#52738c]">
                          دخول التطوير القديم (للتهيئة الأولية فقط)
                        </summary>
                        <form
                          className="mt-3 space-y-2"
                          onSubmit={event => {
                            event.preventDefault();
                            localLogin.mutate({
                              userId: Number(devUserId),
                              password: devPassword,
                              warehouseId: Number(devWarehouseId),
                            });
                          }}
                        >
                          <select
                            value={devUserId}
                            onChange={event => {
                              const nextUserId = event.target.value;
                              const nextUser = (localUsers.data ?? []).find(
                                entry => entry.id === Number(nextUserId)
                              );
                              setDevUserId(nextUserId);
                              setDevWarehouseId(
                                nextUser?.warehouseIds?.[0]
                                  ? String(nextUser.warehouseIds[0])
                                  : ""
                              );
                            }}
                            aria-label="المستخدم القديم"
                            className="h-10 w-full rounded-md border border-[#b9d8e8] bg-white px-3 text-sm text-[#173c61]"
                          >
                            <option value="">اختر المستخدم</option>
                            {(localUsers.data ?? []).map(entry => (
                              <option key={entry.id} value={entry.id}>
                                {entry.name || entry.email || `مستخدم رقم ${entry.id}`} — {roleLabels[entry.role] ?? entry.role}
                              </option>
                            ))}
                          </select>
                          <select
                            value={devWarehouseId}
                            onChange={event => setDevWarehouseId(event.target.value)}
                            aria-label="مستودع المستخدم القديم"
                            required
                            disabled={!devUserId || availableWarehouses.length <= 1}
                            className="h-10 w-full rounded-md border border-[#b9d8e8] bg-white px-3 text-sm text-[#173c61]"
                          >
                            <option value="">اختر المستودع</option>
                            {availableWarehouses.map(warehouse => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} — {warehouse.code}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="password"
                            value={devPassword}
                            onChange={event => setDevPassword(event.target.value)}
                            placeholder="كلمة مرور التطوير المشتركة"
                            aria-label="كلمة مرور التطوير"
                          />
                          <Button
                            type="submit"
                            disabled={localLogin.isPending || !devPassword || !devUserId || !devWarehouseId}
                            variant="outline"
                            className="h-10 w-full rounded-sm border-[#0874bc] text-[#0874bc]"
                          >
                            {localLogin.isPending ? "جارٍ تسجيل الدخول…" : "الدخول المؤقت"}
                          </Button>
                        </form>
                      </details>
                    )}
                  </>
                )}
                <div className="mt-6 border-t border-[#d3e6f2] pt-5">
                  <div className="flex items-start gap-2 text-xs leading-6 text-[#63849d]">
                    <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#1176a8]" />
                    تُخزّن كلمات المرور بصورة مجزأة، ولا تُحفظ كنص صريح.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="mt-5 flex items-center gap-1 text-sm font-bold text-[#1e73a4] transition-colors hover:text-[#064f81]"
                >
                  <ArrowRight className="h-4 w-4" />
                  العودة إلى واجهة النظام
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
