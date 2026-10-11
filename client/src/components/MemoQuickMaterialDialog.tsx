import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type MaterialForm = {
  code: string;
  name: string;
  description: string;
  unit: string;
  barcode: string;
  minimumStock: string;
};
const emptyMaterial = (name = ""): MaterialForm => ({
  code: "",
  name,
  description: "",
  unit: "عدد",
  barcode: "",
  minimumStock: "0",
});

export function MemoQuickMaterialDialog({
  open,
  onOpenChange,
  initialName,
  onMaterialCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onMaterialCreated: (material: {
    id: number;
    code: string;
    name: string;
    unit: string;
  }) => void;
}) {
  const [form, setForm] = useState<MaterialForm>(() =>
    emptyMaterial(initialName)
  );
  const utils = trpc.useUtils();
  useEffect(() => {
    if (open) setForm(emptyMaterial(initialName));
  }, [initialName, open]);
  const createMutation = trpc.materials.create.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.materials.list.invalidate(),
        utils.materials.previewList.invalidate(),
      ]);
      onMaterialCreated({
        id: result.id,
        code: form.code.trim(),
        name: form.name.trim(),
        unit: form.unit.trim(),
      });
      onOpenChange(false);
      toast.success("تمت إضافة المادة وإدراجها في المذكرة.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ المادة."),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      unit: form.unit,
      barcode: form.barcode || undefined,
      minimumStock: Number(form.minimumStock || 0),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة مادة جديدة</DialogTitle>
          <DialogDescription className="sr-only">
            أدخل بيانات المادة الجديدة لإضافتها إلى المذكرة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            لم تظهر مادة مطابقة للبحث؛ أدخل بياناتها ثم ستُضاف مباشرةً إلى سطر
            المذكرة الحالي.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="memo-material-code">رمز المادة</Label>
              <Input
                id="memo-material-code"
                required
                value={form.code}
                onChange={event =>
                  setForm(current => ({ ...current, code: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memo-material-name">اسم المادة</Label>
              <Input
                id="memo-material-name"
                required
                autoFocus
                value={form.name}
                onChange={event =>
                  setForm(current => ({ ...current, name: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="memo-material-unit">الوحدة</Label>
              <Input
                id="memo-material-unit"
                required
                value={form.unit}
                onChange={event =>
                  setForm(current => ({ ...current, unit: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memo-material-minimum">الحد الأدنى</Label>
              <Input
                id="memo-material-minimum"
                type="number"
                min="0"
                step="1"
                value={form.minimumStock}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    minimumStock: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="memo-material-barcode">الباركود</Label>
              <Input
                id="memo-material-barcode"
                value={form.barcode}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    barcode: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memo-material-description">الوصف</Label>
              <Input
                id="memo-material-description"
                value={form.description}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <Button
            disabled={createMutation.isPending}
            className="bg-[#17698a] hover:bg-[#125875]"
          >
            {createMutation.isPending ? "جار الحفظ…" : "حفظ المادة وإضافتها"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
