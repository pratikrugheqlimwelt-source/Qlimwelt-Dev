-- Optional GWP persistence on company settings
alter table public.company_settings
  add column if not exists gwp_values jsonb not null default '{
    "CO2": 1, "CH4": 27.9, "N2O": 273, "HFCs": 1430, "PFCs": 6630, "SF6": 25200, "NF3": 17400
  }'::jsonb;
