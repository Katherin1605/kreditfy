-- =========================================================
-- MIGRACIÓN FASE 3 — Multi-tenant (Kreditfy)
-- =========================================================
-- Ejecutar completo en una sola transacción.
-- Es seguro correrlo más de una vez (usa IF NOT EXISTS / IF EXISTS).
-- Al finalizar el sistema sigue funcionando igual para el tenant 1.
-- =========================================================

--ROLLBACK; -- En caso de error, deshace todos los cambios. Ejecutar por separado.

BEGIN;

-- ---------------------------------------------------------
-- 1. TABLA TENANTS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(50)  UNIQUE NOT NULL,
  logo_url   TEXT,
  currency   VARCHAR(10)  NOT NULL DEFAULT 'USD',
  active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------
-- 2. AGREGAR tenant_id A TODAS LAS TABLAS
--    (como NULL primero — se rellena en el paso 3)
-- ---------------------------------------------------------

ALTER TABLE customers       ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE products        ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE sales            ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE sale_details    ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE payments        ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE shopping        ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE admins          ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE audit_logs      ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE monthly_closings ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- Nota: exchange_rates NO es una tabla — es una API externa con caché
-- en memoria (dolarapi.com). No necesita tenant_id.


-- ---------------------------------------------------------
-- 3. CREAR TENANT INICIAL Y MIGRAR DATOS EXISTENTES
--    (el negocio que ya usa el sistema queda como tenant 1)
-- ---------------------------------------------------------

INSERT INTO tenants (name, slug, currency)
VALUES ('CrediShoping', 'credishoping', 'USD')
ON CONFLICT (slug) DO NOTHING;

-- Asignar todos los registros existentes al tenant 1
UPDATE customers        SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE products         SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE sales             SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE sale_details     SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE payments         SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE shopping         SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE audit_logs       SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE monthly_closings SET tenant_id = 1 WHERE tenant_id IS NULL;

-- admins: solo asignar los que NO sean platform_admin
-- (platform_admin mantiene tenant_id = NULL deliberadamente)
UPDATE admins SET tenant_id = 1
WHERE tenant_id IS NULL AND role != 'platform_admin';


-- ---------------------------------------------------------
-- 4. HACER tenant_id NOT NULL
--    (admins se omite — platform_admin necesita tenerlo en NULL)
-- ---------------------------------------------------------

ALTER TABLE customers       ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE products        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sales            ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sale_details    ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payments        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE shopping        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE audit_logs      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE monthly_closings ALTER COLUMN tenant_id SET NOT NULL;


-- ---------------------------------------------------------
-- 5. CORREGIR UNIQUE CONSTRAINT EN monthly_closings
--    UNIQUE(year, month) no alcanza — dos tenants distintos
--    pueden tener cierre del mismo año/mes.
-- ---------------------------------------------------------

ALTER TABLE monthly_closings
  DROP CONSTRAINT IF EXISTS monthly_closings_year_month_key;

ALTER TABLE monthly_closings
  ADD CONSTRAINT monthly_closings_year_month_tenant_key
  UNIQUE (year, month, tenant_id);


-- ---------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO
--    Sin estos, cada query escanea filas de todos los tenants.
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_tenant      ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant       ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant          ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_details_tenant   ON sale_details(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant       ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shopping_tenant       ON shopping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant          ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monthly_closings_tenant ON monthly_closings(tenant_id);


-- ---------------------------------------------------------
-- 7. CREAR USUARIO platform_admin DE KREDITFY
--    Reemplaza 'TU_EMAIL' y 'TU_PASSWORD_HASHEADO' antes de ejecutar.
--    Para generar el hash: desde Node.js → bcrypt.hashSync('password', 10)
-- ---------------------------------------------------------

INSERT INTO admins (name, email, password, role, tenant_id)
VALUES ('Kreditfy Admin', 'admin@kreditfy.com', '$2b$10$kByA.oqba/Bku3aCFk4Vq.KUs01QFt9C/d47AmqYDeceGMCyVuoGq', 'platform_admin', NULL);


COMMIT;


-- =========================================================
-- VERIFICACIÓN (ejecutar por separado tras el COMMIT)
-- =========================================================
SELECT id, name, slug FROM tenants;
SELECT COUNT(*), tenant_id FROM customers GROUP BY tenant_id;
SELECT COUNT(*), tenant_id FROM sales GROUP BY tenant_id;
SELECT id, name, role, tenant_id FROM admins;
