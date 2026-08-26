Field Ledger code import
========================
Office: nothing in these CSVs is auto-loaded. Open Code book as admin, download a
pack, then use CSV import.

Phone: do not copy these CSVs onto the phone. The truck app is one HTML file —
  /Maichles-Code-Book.html
hosted on the shop site. Open that link on iPhone or Android and add it to the
home screen, or save that single file. A zip, a Python server, extra CSS, or a
folder of scripts will not run as an app on a phone.

books
  invoice   47 office / labor codes (DIAG, SRV-CH, PM1A–PM13C, WARRANTY, …)
  plumbing  1,172 job codes converted from Plumbing.xlsx (PA/PB/PC/PD/PE/…/PR)
  hvac      3,159 codes converted from Service.csv (HA/HB/HT/HZ plus equipment,
            filters, service charges)

columns
  book,code,description,category,trade,hours,parts_allowance,list_price,labor_value,active,notes

mapping from QuickBooks export
  Item Name     → code
  Description   → description  (\CR line breaks flattened)
  Category      → category     (HA/HB/HT/HZ and PA–PR prefixes grouped)
  Rate          → list_price and labor_value
  Mfg Part #    → notes
  Item Type     → notes; Discount rows import as inactive, 0 hours

hours
  Known typical hours from the previous book are kept (PA1A, PA6A, …).
  "Additional hour" codes = 1.0.
  Everything else is estimated as Rate ÷ $185, rounded to 0.25 hr.
  Edit typical hours after import if a code's sold hours differ.

parts
  parts_allowance is 0 on purpose. Techs enter receipt cost on the job so
  rough gross profit is receipt vs code list, not a petty-cash guess.

reconvert (also rewrites the one-file phone book)
  python3 tools/convert_pricebooks.py \
    --service attachments/Service.csv \
    --plumbing attachments/Plumbing.xlsx \
    --out public/samples

import
  Admin Code book → choose one or many CSV files. Large packs import in
  batches of 400. Combined "all books" is 4,378 rows.
