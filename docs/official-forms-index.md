# فهرس النماذج الرسمية المدعومة

يوثق هذا الفهرس النماذج الرسمية غير التابعة للمذكرات في نطاق التطبيق الحالي. يرتبط كل نموذج بقالب الطباعة الموحد، وبدليل المعاينة، وباختبارات العقد التي تمنع تغيير ترتيب الرأس أو إدخال قيم بديلة في الحقول غير المتاحة.

| النموذج | نوع القالب | المرجع البصري | الدليل والاختبار | ضوابط البيانات |
|---|---|---|---|---|
| يومية الإدخالات | `inboundJournal` | `الادخالات.png` | `OfficialReportsEvidence.tsx` و`officialReportLayout.contract.test.ts` | المواصفات والملاحظات تبقى فارغة عند غيابها. |
| يومية الإخراجات | `outboundJournal` | `الاخراجات.png` | `OfficialReportsEvidence.tsx` و`officialReportLayout.contract.test.ts` | الجهة المستلمة تظهر فقط عندما تكون متاحة. |
| بطاقة مواد | `materialCard` | `بطاقةالمواد.png` | `OfficialReportsEvidence.tsx` و`officialReportLayout.contract.test.ts` | رقم البطاقة مستقل عن الرمز ويبقى فارغًا بلا مصدر موثوق. |
| جدول الجرد | `inventory` | `الجرد1.png` و`الجرد2.png` | `OfficialReportsEvidence.tsx` و`officialReportLayout.contract.test.ts` | الجرد الفعلي والفروق والاعتمادات فارغة ما لم يوجد محضر جرد. |
| جدول حركة المواد | `monthlyMovement` | `طباعةشهرية1.png` و`طباعةشهرية2.png` | `OfficialReportsEvidence.tsx` و`officialReportLayout.contract.test.ts` | مواد الصفر مخفية، والوصف والملاحظات فارغان عند الغياب. |

> يستعمل المسار `/_official-reports-evidence` القوالب نفسها التي تستدعيها أزرار المعاينة والطباعة. لذلك يعد الدليل البصري فحصًا للقالب التشغيلي وليس نسخة مستقلة منه.
