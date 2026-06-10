/* Agregar columna cuotas a la tabla sales */

ALTER TABLE sales ADD COLUMN IF NOT EXISTS cuotas INTEGER NOT NULL DEFAULT 1;

/* Agregar columnas active y permissions a la tabla admins */

ALTER TABLE admins ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT ARRAY['customers','products','shopping','sales','payments','audit']::TEXT[];
