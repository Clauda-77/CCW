# Verification Notes

- The permanent preview shows the original light blue interface styling.
- The inventory page displays real imported material rows, including zero-quantity rows in the on-screen table.
- The inbound memo editor opens with real materials and a suggested warehouse value.
- The active memo code now resolves the current warehouse from the imported data using the central warehouse name first, then safe active-warehouse fallbacks; the warehouse select remains disabled outside entry memos.
- The official inventory print renderer converts numeric or string zero cell values to blank cells only when `pageReport.type === "inventory"`.
- Targeted official-report contract test passed after this change; full TypeScript check and full Vitest suite passed with 122 tests.
- The attached SQL had malformed escaped-quote statements when re-run without `--force`; the existing imported database contains 13,973 materials and the UI loads the real records. A clean no-force replay remains separately documented as pending.

## Database verification

The current permanent database verification returned: warehouses=43, parties=2342, materials=13973, memos=4543, memoItems=62968, inventoryBalances=5249, stockMovements=0, importBatches=3. The attached dump contains malformed escaped-quote rows; clean replay attempts failed at the reported malformed statements, so the existing operational records were preserved rather than risking destructive or duplicate re-import. The application derives movement reporting from approved memo records and the imported memo/item data is present for real testing.
