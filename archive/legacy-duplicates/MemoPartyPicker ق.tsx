import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type PartyForm = {
  legacyNumber: string;
  name: string;
  type: "supplier" | "recipient" | "both" | "internal";
  phone: string;
  address: string;
};

const emptyParty = (name = ""): PartyForm => ({ legacyNumber: "", name, type: "both", phone: "", address: "" });

export function MemoPartyPicker({
  value,
  onChange,
  canCreate,
  placeholder = "ابحث",
}: {
  value: string;
  onChange: (value: string) => void;
  canCreate: boolean;
  placeholder?: string;
}) {

  const [search, setSearch] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PartyForm>(emptyParty());
  const isDevelopment = import.meta.env.DEV;
  const utils = trpc.useUtils();
  const live = trpc.entities.listParties.useQuery({ search, limit: 500 }, { enabled: !isDevelopment });
  const preview = trpc.entities.previewListParties.useQuery({ search, limit: 500 }, { enabled: isDevelopment });
  const parties = (isDevelopment ? preview.data : live.data) ?? [];
  const activeParties = parties.filter(party => party.isActive);
  const createMutation = trpc.entities.createParty.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.entities.overview.invalidate(), utils.entities.listParties.invalidate(), utils.entities.previewListParties.invalidate()]);
      onChange(String(result.id));
      setSearch(form.name);
      setListOpen(false);
      setOpen(false);
      setForm(emptyParty());
      toast.success("تمت إضافة الجهة واختيارها للمذكرة.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ الجهة."),
  });

  const openCreate = () => {
    setForm(emptyParty(search.trim()));
    setListOpen(false);
    setOpen(true);
  };
  const chooseParty = (id: number, name: string) => {
    onChange(String(id));
    setSearch(name);
    setListOpen(false);
  };
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setListOpen(false); return; }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!search.trim() || activeParties.length > 0) return;
      if (!canCreate) { toast.error("لا تملك صلاحية إضافة جهة جديدة."); return; }
      openCreate();
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  return <>
    
    <div className="relative mt-1.5"><Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input autoComplete="off" value={search} onFocus={() => setListOpen(true)} onChange={event => { setSearch(event.target.value); onChange(""); setListOpen(true); }} onKeyDown={handleSearchKeyDown} className="h-9 pr-8 text-sm" placeholder={placeholder}
 aria-label="بحث واختيار جهة أو مورد" /></div>
    {listOpen && <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-[#b8ddeb] bg-white text-sm shadow-sm">
      <button type="button" onClick={() => { onChange(""); setSearch(""); }} className={`flex w-full items-center px-2 py-1.5 text-right hover:bg-[#eaf8fe] ${value === "" ? "bg-[#eaf8fe] font-bold text-[#07518e]" : ""}`}>من دون جهة</button>
      {activeParties.map(party => <button key={party.id} type="button" onClick={() => chooseParty(party.id, party.name)} className={`flex w-full items-center px-2 py-1.5 text-right hover:bg-[#eaf8fe] ${value === String(party.id) ? "bg-[#eaf8fe] font-bold text-[#07518e]" : ""}`}>{party.name}</button>)}
      {search.trim() && activeParties.length === 0 && canCreate && <button type="button" onClick={openCreate} className="flex w-full items-center border-t border-dashed border-[#86cef0] px-2 py-2 text-right font-bold text-[#07518e] hover:bg-[#eaf8fe]">إضافة جهة جديدة باسم «{search.trim()}»</button>}
      {search.trim() && activeParties.length === 0 && !canCreate && <p className="px-2 py-2 text-xs text-muted-foreground">لا توجد جهة مطابقة.</p>}
    </div>}

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle className="text-right">إضافة جهة جديدة</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="memo-party-number">رقم المورد</Label><Input id="memo-party-number" value={form.legacyNumber} onChange={event => setForm(current => ({ ...current, legacyNumber: event.target.value }))} /></div><div className="grid gap-2"><Label htmlFor="memo-party-name">اسم الجهة</Label><Input id="memo-party-name" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></div></div>
          <div className="grid gap-2"><Label htmlFor="memo-party-type">نوع الجهة</Label><select id="memo-party-type" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as PartyForm["type"] }))}><option value="both">مورد ومستلم</option><option value="supplier">مورّد</option><option value="recipient">مستلم</option><option value="internal">داخلية</option></select></div>
          <div className="grid gap-2"><Label htmlFor="memo-party-phone">الهاتف</Label><Input id="memo-party-phone" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} /></div>
          <div className="grid gap-2"><Label htmlFor="memo-party-address">العنوان</Label><Input id="memo-party-address" value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} /></div>
          <Button disabled={createMutation.isPending} className="bg-[#17698a] hover:bg-[#125875]">{createMutation.isPending ? "جار الحفظ…" : "حفظ الجهة"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
