import {
  ClipboardCheck,
  DatabaseZap,
  Eye,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const roles = [
  {
    name: "مدير النظام",
    detail:
      "صلاحية كاملة على جميع المستودعات، وإدارة الحسابات والأدوار وربط المستخدمين والبيانات المرجعية، ومراجعة واعتماد المذكرات.",
    icon: ShieldCheck,
    bg: "#e8f2e8",
    color: "#39744b",
  },
  {
    name: "أمين مستودع",
    detail:
      "إدارة عمليات الاستلام والتسليم والأرصدة وإنشاء/تعديل المذكرات ضمن المستودعات المسندة؛ لا يملك الاعتماد النهائي.",
    icon: UserCog,
    bg: "#e3f1f7",
    color: "#17698a",
  },
  {
    name: "مدخل بيانات",
    detail:
      "إنشاء مسودات المذكرات وتعديلها ضمن المستودعات المسندة، دون اعتماد نهائي أو إدارة المستخدمين والبيانات المرجعية.",
    icon: DatabaseZap,
    bg: "#fdebed",
    color: "#ab5062",
  },
  {
    name: "مراجع",
    detail:
      "مراجعة المذكرات والتحقق منها واعتمادها ضمن المستودعات المسندة؛ لا ينشئ المذكرات ولا يدير المستودعات أو الحسابات.",
    icon: ClipboardCheck,
    bg: "#fff1dc",
    color: "#a4650b",
  },
  {
    name: "مستخدم للقراءة فقط",
    detail:
      "عرض المعلومات المسموح بها فقط، دون إنشاء أو تعديل أو اعتماد. يقتصر نطاقه على المستودعات المسندة إليه.",
    icon: Eye,
    bg: "#f0eafd",
    color: "#6847a5",
  },
] as const;

export default function AccessPage() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-6">
      <section>
        <p className="text-sm font-semibold text-[#17698a]">الحوكمة</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          الأدوار والصلاحيات
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          يُطبّق التحقق من الصلاحيات في الخادم والواجهة معًا. المدير يرى جميع
          المستودعات؛ أما بقية الأدوار فتُقيّد بالمستودعات المسندة إلى حساباتها.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {roles.map(({ name, detail, icon: Icon, bg, color }) => (
          <Card key={name} className="soft-shadow border-white/75 bg-white/85">
            <CardContent className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: bg, color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-7 text-lg font-extrabold">{name}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {detail}
              </p>
              <Badge
                className="mt-5 border-0"
                style={{ backgroundColor: bg, color }}
              >
                حسب الدور والإسناد
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/75 bg-[#f9fbfc]/90">
        <CardContent className="p-6">
          <h2 className="font-extrabold">سير اعتماد المذكرات</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-[#ab5062]">مدخل البيانات / أمين المستودع</p>
              <p className="mt-1 text-sm">ينشئ المذكرة ويعدّل المسودة ضمن نطاق الإسناد.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#a4650b]">المراجع</p>
              <p className="mt-1 text-sm">يراجع التفاصيل ويعتمد ضمن المستودع المخوّل له.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#39744b]">المدير</p>
              <p className="mt-1 text-sm">يدير الحسابات والبيانات المرجعية ويشرف على الاعتماد في جميع المستودعات.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
