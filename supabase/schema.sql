-- Supabase schema for Control Crítico Planta Bimbo
-- ------------------------------------------------------------
-- 1. Table: packing (empaquetado)
CREATE TABLE IF NOT EXISTS packing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status text NOT NULL,               -- 'OPEN' | 'CLOSED'
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Table: waste (merma)
CREATE TABLE IF NOT EXISTS waste (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id text NOT NULL,                -- e.g. 'PAN', 'BOLLERIA'
    amount numeric NOT NULL CHECK (amount >= 0),
    packing_id uuid NOT NULL REFERENCES packing(id) ON DELETE RESTRICT,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Table: alerts (alertas críticas)
CREATE TABLE IF NOT EXISTS alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id text NOT NULL,
    shift text NOT NULL CHECK (shift IN ('DAY', 'NIGHT')),
    date date NOT NULL,
    total numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (line_id, shift, date)          -- evita duplicados
);

-- 4. Table: settings (configuración opcional)
CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL
);

-- Default threshold for merma
INSERT INTO settings (key, value) VALUES ('waste_threshold', '100')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ------------------------------------------------------------
-- Fin del script
