Field Ledger beta code import
================================
These files are extracted from the MaichlesEdge Netlify build you attached.
They are NOT loaded into Field Ledger automatically. Import them yourself
from Code book when you are ready.

books
  invoice   Price/Labor & Material (PM1A–PM13C) plus office codes (DIAG, SRV-CH, EST, WARRANTY, CALLBACK, TRUCK-ORG, 14, MANUAL)
  plumbing  Job codes (PA/PB/PC/PD/PE/PF/PG/PH/PR) plus drain cleaning and water-heater installs
  hvac      HVAC-DIAG through HVAC-INSTALL (12 codes)

columns
  book,code,description,category,trade,hours,parts_allowance,list_price,labor_value,active,notes

You can upload one combined file (codes-all.csv) or the three split files.
