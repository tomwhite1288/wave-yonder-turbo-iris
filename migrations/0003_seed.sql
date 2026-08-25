-- Catalog + roster seed for Maichle's Edge Field Ledger (New Castle, DE).
-- Operational tickets and live timecards are hydrated at runtime so they stay "today".

insert into companies (id, name, legal_name, timezone)
values ('co_maichles', 'Maichle''s Edge Field', 'Maichle''s Heating & Air Conditioning, Inc.', 'America/New_York')
on conflict (id) do nothing;

insert into settings (company_id, key, value) values
  ('co_maichles', 'gps_radius_ft', '250'),
  ('co_maichles', 'gps_interval_sec', '30'),
  ('co_maichles', 'gps_grace_min', '5'),
  ('co_maichles', 'gps_accuracy_threshold_m', '50'),
  ('co_maichles', 'approaching_multiplier', '3'),
  ('co_maichles', 'exception_tolerance_min', '15'),
  ('co_maichles', 'overtime_daily_hours', '8'),
  ('co_maichles', 'overtime_weekly_hours', '40'),
  ('co_maichles', 'overtime_multiplier', '1.5'),
  ('co_maichles', 'double_time_enabled', 'false'),
  ('co_maichles', 'travel_counts_as_field', 'true'),
  ('co_maichles', 'efficiency_available_source', 'schedule'),
  ('co_maichles', 'tracking_only_during_work', 'true'),
  ('co_maichles', 'labor_rate', '185'),
  ('co_maichles', 'parts_markup', '1.55'),
  ('co_maichles', 'location_retention_days', '90'),
  ('co_maichles', 'admin_access_code_hash', '178a2e9c25e0ec69bb6ed2f072c326af4c0f0734f0d5111803e3897c3c73b94d'),
  ('co_maichles', 'admin_code_hint', 'true'),
  ('co_maichles', 'admin_emails', '')
on conflict (company_id, key) do nothing;

insert into employees (id, company_id, employee_number, first_name, last_name, email, role, department, labor_classification, pay_type, phone, vehicle, active) values
  ('emp_pat', 'co_maichles', 'E-100', 'Pat', 'Maichle', 'pat@maichlesedge.com', 'admin', 'Operations', 'Administrator', 'salary', '302-328-4822', 'Office', true),
  ('emp_sarah', 'co_maichles', 'E-110', 'Sarah', 'Chen', 'sarah.chen@maichlesedge.com', 'manager', 'Field Supervision', 'Supervisor', 'salary', '302-328-4822', 'SUV-1', true),
  ('emp_john', 'co_maichles', 'E-221', 'John', 'Smith', 'john.smith@maichlesedge.com', 'technician', 'Plumbing', 'Plumber', 'hourly', '302-555-0141', 'Van 12', true),
  ('emp_marcus', 'co_maichles', 'E-222', 'Marcus', 'Hale', 'marcus.hale@maichlesedge.com', 'technician', 'HVAC', 'HVAC Tech', 'hourly', '302-555-0142', 'Van 18', true),
  ('emp_elena', 'co_maichles', 'E-223', 'Elena', 'Ruiz', 'elena.ruiz@maichlesedge.com', 'technician', 'Plumbing', 'Plumber', 'hourly', '302-555-0143', 'Van 7', true),
  ('emp_derrick', 'co_maichles', 'E-224', 'Derrick', 'Walsh', 'derrick.walsh@maichlesedge.com', 'technician', 'HVAC', 'HVAC Tech', 'hourly', '302-555-0144', 'Van 21', true)
on conflict (id) do nothing;

insert into pay_rates (id, employee_id, hourly_wage, overtime_multiplier, double_time_multiplier, effective_from, effective_to, created_by) values
  ('pr_john_29', 'emp_john', 29.00, 1.5, 2.0, '2024-01-01', '2025-12-31', 'system'),
  ('pr_john_32', 'emp_john', 32.00, 1.5, 2.0, '2026-01-01', null, 'system'),
  ('pr_marcus', 'emp_marcus', 34.50, 1.5, 2.0, '2025-06-01', null, 'system'),
  ('pr_elena', 'emp_elena', 31.00, 1.5, 2.0, '2025-03-01', null, 'system'),
  ('pr_derrick', 'emp_derrick', 36.00, 1.5, 2.0, '2025-01-01', null, 'system'),
  ('pr_sarah', 'emp_sarah', 42.00, 1.5, 2.0, '2025-01-01', null, 'system'),
  ('pr_pat', 'emp_pat', 55.00, 1.5, 2.0, '2024-01-01', null, 'system')
on conflict (id) do nothing;

insert into schedules (id, employee_id, day_of_week, start_minutes, end_minutes, active) values
  ('sch_john_1', 'emp_john', 1, 450, 960, true),
  ('sch_john_2', 'emp_john', 2, 450, 960, true),
  ('sch_john_3', 'emp_john', 3, 450, 960, true),
  ('sch_john_4', 'emp_john', 4, 450, 960, true),
  ('sch_john_5', 'emp_john', 5, 450, 960, true),
  ('sch_marcus_1', 'emp_marcus', 1, 450, 960, true),
  ('sch_marcus_2', 'emp_marcus', 2, 450, 960, true),
  ('sch_marcus_3', 'emp_marcus', 3, 450, 960, true),
  ('sch_marcus_4', 'emp_marcus', 4, 450, 960, true),
  ('sch_marcus_5', 'emp_marcus', 5, 450, 960, true),
  ('sch_elena_1', 'emp_elena', 1, 450, 960, true),
  ('sch_elena_2', 'emp_elena', 2, 450, 960, true),
  ('sch_elena_3', 'emp_elena', 3, 450, 960, true),
  ('sch_elena_4', 'emp_elena', 4, 450, 960, true),
  ('sch_elena_5', 'emp_elena', 5, 450, 960, true),
  ('sch_derrick_1', 'emp_derrick', 1, 420, 960, true),
  ('sch_derrick_2', 'emp_derrick', 2, 420, 960, true),
  ('sch_derrick_3', 'emp_derrick', 3, 420, 960, true),
  ('sch_derrick_4', 'emp_derrick', 4, 420, 960, true),
  ('sch_derrick_5', 'emp_derrick', 5, 420, 1020, true),
  ('sch_sarah_1', 'emp_sarah', 1, 450, 1020, true),
  ('sch_sarah_2', 'emp_sarah', 2, 450, 1020, true),
  ('sch_sarah_3', 'emp_sarah', 3, 450, 1020, true),
  ('sch_sarah_4', 'emp_sarah', 4, 450, 1020, true),
  ('sch_sarah_5', 'emp_sarah', 5, 450, 1020, true)
on conflict (id) do nothing;

insert into code_book (id, company_id, code, description, category, trade, hours, labor_value, typical_duration_min, active, notes) values
  ('cb_a', 'co_maichles', 'A', 'Standard service — 1.0 hour', 'Labor', 'both', 1.0, 185, 60, true, 'Default PM / diagnostic increment'),
  ('cb_b', 'co_maichles', 'B', 'Extended service — 1.5 hours', 'Labor', 'both', 1.5, 277.5, 90, true, null),
  ('cb_c', 'co_maichles', 'C', 'Major service — 2.0 hours', 'Labor', 'both', 2.0, 370, 120, true, null),
  ('cb_d', 'co_maichles', 'D', 'Complex repair — 2.5 hours', 'Labor', 'both', 2.5, 462.5, 150, true, null),
  ('cb_e', 'co_maichles', 'E', 'Heavy repair — 3.0 hours', 'Labor', 'both', 3.0, 555, 180, true, null),
  ('cb_diag', 'co_maichles', 'DIAG', 'Diagnostic / trip charge', 'Diagnostic', 'both', 0.75, 139, 45, true, null),
  ('cb_pm1', 'co_maichles', 'PM1', 'Precision tune-up (single system)', 'Maintenance', 'hvac', 1.0, 185, 60, true, null),
  ('cb_pm2', 'co_maichles', 'PM2', 'Precision tune-up (split / dual)', 'Maintenance', 'hvac', 1.5, 277.5, 90, true, null),
  ('cb_cap', 'co_maichles', 'CAP', 'Capacitor replacement', 'Repair', 'hvac', 1.0, 185, 60, true, null),
  ('cb_cnt', 'co_maichles', 'CNT', 'Contactor replacement', 'Repair', 'hvac', 1.0, 185, 60, true, null),
  ('cb_whr', 'co_maichles', 'WH-R', 'Water heater replacement', 'Install', 'plumbing', 4.0, 740, 240, true, null),
  ('cb_wtr', 'co_maichles', 'WTR', 'Water heater repair', 'Repair', 'plumbing', 1.5, 277.5, 90, true, null),
  ('cb_toi', 'co_maichles', 'TOI', 'Toilet rebuild / replacement', 'Repair', 'plumbing', 1.5, 277.5, 90, true, null),
  ('cb_fau', 'co_maichles', 'FAU', 'Faucet replacement', 'Repair', 'plumbing', 1.0, 185, 60, true, null),
  ('cb_dsp', 'co_maichles', 'DSP', 'Garbage disposal replacement', 'Install', 'plumbing', 1.5, 277.5, 90, true, null),
  ('cb_snk', 'co_maichles', 'SNK', 'Sewer / drain machine', 'Service', 'plumbing', 1.0, 185, 60, true, null),
  ('cb_blw', 'co_maichles', 'BLW', 'Blower motor replacement', 'Repair', 'hvac', 2.5, 462.5, 150, true, null),
  ('cb_brd', 'co_maichles', 'BRD', 'Control board replacement', 'Repair', 'hvac', 2.0, 370, 120, true, null),
  ('cb_thm', 'co_maichles', 'THM', 'Thermostat install', 'Install', 'hvac', 1.0, 185, 60, true, null),
  ('cb_adm', 'co_maichles', 'ADM', 'Administrative / shop time', 'Admin', 'both', 0, 0, 30, true, 'Non-billable by default')
on conflict (id) do nothing;

insert into parts (id, company_id, part_number, manufacturer, description, category, subcategory, cost, sell_price, markup, vendor, stock_qty, warehouse_qty, keywords, aliases, active) values
  ('pt_moen_1225', 'co_maichles', '1225', 'Moen', '1225 cartridge (Posi-Temp)', 'plumbing', 'Cartridges', 12.40, 28.95, 1.33, 'Ferguson', 18, 40, 'cartridge faucet stem moen 1225', '1225B, Posi-Temp', true),
  ('pt_moen_1200', 'co_maichles', '1200', 'Moen', '1200 two-handle cartridge', 'plumbing', 'Cartridges', 9.80, 22.50, 1.30, 'Ferguson', 12, 24, 'cartridge faucet moen 1200', '1200B', true),
  ('pt_kohler_gp85160', 'co_maichles', 'GP85160', 'Kohler', 'Class 5 fill valve', 'plumbing', 'Fill valves', 14.20, 32.00, 1.25, 'Ferguson', 10, 20, 'fill valve toilet kohler', '85160', true),
  ('pt_fluid_400a', 'co_maichles', '400A', 'Fluidmaster', '400A fill valve', 'plumbing', 'Fill valves', 7.10, 18.95, 1.67, 'HD Supply', 24, 60, 'fill valve toilet fluidmaster', '400AFR', true),
  ('pt_fluid_501', 'co_maichles', '501', 'Fluidmaster', 'Universal flapper', 'plumbing', 'Flappers', 3.40, 9.95, 1.93, 'HD Supply', 30, 80, 'flapper toilet', '501P21', true),
  ('pt_kohler_k3950', 'co_maichles', 'K-3950', 'Kohler', 'Wellworth elongated toilet', 'plumbing', 'Toilets', 185.00, 429.00, 1.32, 'Ferguson', 2, 6, 'toilet kohler wellworth', '3950', true),
  ('pt_delta_rp19804', 'co_maichles', 'RP19804', 'Delta', 'Monitor 14 cartridge', 'plumbing', 'Cartridges', 18.50, 42.00, 1.27, 'Ferguson', 8, 16, 'delta cartridge monitor', 'RP46463', true),
  ('pt_insin_d2200', 'co_maichles', 'D2200', 'InSinkErator', 'Badger 5 garbage disposal 1/2 HP', 'plumbing', 'Garbage disposals', 92.00, 219.00, 1.38, 'Ferguson', 3, 8, 'disposal garbage insinkerator badger', 'Badger 5', true),
  ('pt_ao_pro40', 'co_maichles', 'PRO+40', 'A.O. Smith', '40-gal atmospheric gas water heater', 'plumbing', 'Water heaters', 780.00, 1649.00, 1.11, 'Ferguson', 1, 4, 'water heater 40 gallon gas', 'GCRH-40', true),
  ('pt_amtrol_st5', 'co_maichles', 'ST-5', 'Amtrol', 'Extrol ST-5 expansion tank', 'plumbing', 'Expansion tanks', 38.00, 89.00, 1.34, 'Ferguson', 6, 12, 'expansion tank amtrol', 'ST5', true),
  ('pt_brass_qtr', 'co_maichles', '1/4-TURN', 'BrassCraft', '1/4-turn angle stop 1/2" SWT x 3/8" OD', 'plumbing', 'Shutoff valves', 6.80, 16.95, 1.49, 'HD Supply', 40, 100, 'stop valve shutoff angle', 'OCR19X C1', true),
  ('pt_supply_20', 'co_maichles', 'SPEX20', 'Fluidmaster', '20" stainless supply line', 'plumbing', 'Supply lines', 4.20, 11.50, 1.74, 'HD Supply', 36, 90, 'supply line braided', 'connector', true),
  ('pt_ptrap_15', 'co_maichles', 'P-TRAP-1.5', 'Dearborn', '1-1/2" tubular P-trap', 'plumbing', 'P-traps', 5.10, 13.95, 1.74, 'HD Supply', 20, 48, 'p-trap sink drain', 'ptrap', true),
  ('pt_pex_half', 'co_maichles', 'PEX-1/2-RED', 'Uponor', '1/2" PEX tubing red (ft)', 'plumbing', 'Tubing', 0.62, 1.85, 1.98, 'Ferguson', 200, 800, 'pex tubing pipe', 'wirsbo', true),
  ('pt_shark_half', 'co_maichles', 'U088LFA', 'SharkBite', '1/2" coupling', 'plumbing', 'Fittings', 4.90, 12.95, 1.64, 'Ferguson', 28, 70, 'sharkbite coupling fitting', 'push fit', true),
  ('pt_zoeller_m53', 'co_maichles', 'M53', 'Zoeller', 'M53 sump pump 1/3 HP', 'plumbing', 'Sump pumps', 168.00, 389.00, 1.32, 'Ferguson', 2, 5, 'sump pump zoeller', '53', true),
  ('pt_pentek_std', 'co_maichles', 'STD-10', 'Pentek', '10" standard sediment filter', 'plumbing', 'Filtration', 4.80, 14.95, 2.11, 'HD Supply', 16, 40, 'filter sediment water treatment', '10 inch', true),
  ('pt_wax_gasket', 'co_maichles', 'WAX-G', 'Fluidmaster', 'Wax gasket with horn', 'plumbing', 'Drain components', 2.10, 7.95, 2.79, 'HD Supply', 24, 60, 'wax ring toilet', 'gasket', true),
  ('pt_trane_ttx', 'co_maichles', 'TTX20', 'Trane', '20x25x1 MERV 11 filter', 'hvac', 'Filters', 8.40, 22.00, 1.62, 'Johnstone', 30, 80, 'filter merv trane', '20x25', true),
  ('pt_ge_cap45', 'co_maichles', '97F9852', 'GE', '45/5 µF 370V dual run capacitor', 'hvac', 'Capacitors', 14.80, 42.00, 1.84, 'Johnstone', 14, 32, 'capacitor dual run 45/5', '45+5, 45/5', true),
  ('pt_ge_cap40', 'co_maichles', '97F9834', 'GE', '40/5 µF 370V dual run capacitor', 'hvac', 'Capacitors', 13.90, 39.00, 1.81, 'Johnstone', 12, 28, 'capacitor dual run 40/5', '40+5', true),
  ('pt_supco_cnt', 'co_maichles', '90-334', 'Supco', '30A 1-pole contactor 24V', 'hvac', 'Contactors', 11.20, 34.00, 2.04, 'Johnstone', 10, 24, 'contactor 30 amp', '30A', true),
  ('pt_honey_r8222', 'co_maichles', 'R8222N', 'Honeywell', 'Switching relay 24V', 'hvac', 'Relays', 18.40, 48.00, 1.61, 'Johnstone', 6, 14, 'relay honeywell switching', 'R8222', true),
  ('pt_gemline_blw', 'co_maichles', '5SME39HXL', 'Genteq', '1/2 HP X13 blower motor', 'hvac', 'Motors', 212.00, 489.00, 1.31, 'Johnstone', 1, 3, 'blower motor x13 ecm', 'X13', true),
  ('pt_honey_t6', 'co_maichles', 'TH6320U', 'Honeywell', 'T6 Pro programmable thermostat', 'hvac', 'Thermostats', 68.00, 159.00, 1.34, 'Johnstone', 5, 12, 'thermostat honeywell t6', 'T6 Pro', true),
  ('pt_white_ign', 'co_maichles', '21D64-2', 'White-Rodgers', 'Hot surface ignitor', 'hvac', 'Ignitors', 16.50, 48.00, 1.91, 'Johnstone', 8, 18, 'ignitor hsi furnace', 'igniter', true),
  ('pt_white_flm', 'co_maichles', '21D83-14406', 'White-Rodgers', 'Flame sensor rod', 'hvac', 'Flame sensors', 8.90, 27.00, 2.03, 'Johnstone', 10, 22, 'flame sensor furnace', 'flame rod', true),
  ('pt_trane_brd', 'co_maichles', 'CNT05811', 'Trane', 'Furnace control board', 'hvac', 'Control boards', 186.00, 429.00, 1.31, 'Trane', 1, 2, 'control board furnace trane', 'IFC', true),
  ('pt_little_vcma', 'co_maichles', 'VCMA-20ULS', 'Little Giant', 'Condensate pump 84 GPH', 'hvac', 'Condensate pumps', 42.00, 98.00, 1.33, 'Johnstone', 4, 10, 'condensate pump little giant', 'VCMA', true),
  ('pt_sporlan_txv', 'co_maichles', 'SQE-2', 'Sporlan', 'R-410A TXV 2 ton', 'hvac', 'Refrigeration', 54.00, 128.00, 1.37, 'Johnstone', 2, 5, 'txv expansion valve 410a', 'TEV', true),
  ('pt_hoffman_5x8', 'co_maichles', 'A-5X8', 'Hoffman', '5x8 junction box', 'hvac', 'Electrical', 9.40, 22.00, 1.34, 'Rexel', 12, 30, 'electrical box junction', 'j-box', true),
  ('pt_gates_4l', 'co_maichles', '4L330', 'Gates', '4L330 blower belt', 'hvac', 'Belts', 6.20, 16.95, 1.73, 'Johnstone', 10, 24, 'belt blower 4L', 'V-belt', true),
  ('pt_fasco_brg', 'co_maichles', '203', 'Fasco', 'Motor bearing 203', 'hvac', 'Bearings', 7.80, 19.50, 1.50, 'Johnstone', 8, 16, 'bearing motor', '203ZZ', true),
  ('pt_honey_damp', 'co_maichles', 'ARD12', 'Honeywell', '12" round zone damper', 'hvac', 'Dampers', 86.00, 198.00, 1.30, 'Johnstone', 2, 4, 'damper zone honeywell', 'ARD', true),
  ('pt_white_gasv', 'co_maichles', '36J22', 'White-Rodgers', 'Gas valve 1/2" 24V', 'hvac', 'Valves', 74.00, 176.00, 1.38, 'Johnstone', 2, 4, 'gas valve furnace', '36J', true),
  ('pt_honey_sens', 'co_maichles', 'C7735A', 'Honeywell', 'Discharge air sensor', 'hvac', 'Sensors', 22.00, 54.00, 1.45, 'Johnstone', 4, 8, 'sensor discharge air', 'DAT', true)
on conflict (id) do nothing;

insert into truck_inventory (id, employee_id, vehicle, part_id, quantity, min_quantity) values
  ('ti_john_1225', 'emp_john', 'Van 12', 'pt_moen_1225', 4, 2),
  ('ti_john_400a', 'emp_john', 'Van 12', 'pt_fluid_400a', 6, 3),
  ('ti_john_501', 'emp_john', 'Van 12', 'pt_fluid_501', 8, 4),
  ('ti_john_qtr', 'emp_john', 'Van 12', 'pt_brass_qtr', 10, 4),
  ('ti_john_wax', 'emp_john', 'Van 12', 'pt_wax_gasket', 6, 3),
  ('ti_john_d2200', 'emp_john', 'Van 12', 'pt_insin_d2200', 1, 1),
  ('ti_marcus_cap45', 'emp_marcus', 'Van 18', 'pt_ge_cap45', 3, 2),
  ('ti_marcus_cap40', 'emp_marcus', 'Van 18', 'pt_ge_cap40', 3, 2),
  ('ti_marcus_cnt', 'emp_marcus', 'Van 18', 'pt_supco_cnt', 2, 1),
  ('ti_marcus_ign', 'emp_marcus', 'Van 18', 'pt_white_ign', 2, 1),
  ('ti_marcus_flm', 'emp_marcus', 'Van 18', 'pt_white_flm', 3, 1),
  ('ti_marcus_ttx', 'emp_marcus', 'Van 18', 'pt_trane_ttx', 8, 4),
  ('ti_elena_1225', 'emp_elena', 'Van 7', 'pt_moen_1225', 3, 2),
  ('ti_elena_400a', 'emp_elena', 'Van 7', 'pt_fluid_400a', 4, 2),
  ('ti_elena_ptrap', 'emp_elena', 'Van 7', 'pt_ptrap_15', 4, 2),
  ('ti_elena_st5', 'emp_elena', 'Van 7', 'pt_amtrol_st5', 1, 1),
  ('ti_derrick_cap45', 'emp_derrick', 'Van 21', 'pt_ge_cap45', 2, 2),
  ('ti_derrick_cnt', 'emp_derrick', 'Van 21', 'pt_supco_cnt', 2, 1),
  ('ti_derrick_t6', 'emp_derrick', 'Van 21', 'pt_honey_t6', 1, 1),
  ('ti_derrick_vcma', 'emp_derrick', 'Van 21', 'pt_little_vcma', 1, 1)
on conflict (id) do nothing;

insert into api_keys (id, company_id, name, key_hash, key_prefix, active, created_by) values
  ('ak_demo', 'co_maichles', 'Primary platform (demo)', 'a927acdf746645b7f973ec8225f8aa3eb2de1183471ad6b3764671807acd51c1', 'fld_demo', true, 'system')
on conflict (id) do nothing;
