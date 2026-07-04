-- =============================================================
-- KREDITFY — Setup completo de base de datos
-- Ejecutar UNA sola vez sobre la BD vacía.
-- Incluye: schema + datos iniciales (tenant, admin, planes)
-- =============================================================


-- -------------------------------------------------------------
-- 0. LIMPIAR TODO (por si hay tablas previas)
-- -------------------------------------------------------------
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- -------------------------------------------------------------
-- 1. TENANTS
-- -------------------------------------------------------------
CREATE TABLE tenants (
  id             SERIAL        PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  slug           VARCHAR(50)   UNIQUE NOT NULL,
  logo_url       TEXT,
  currency       VARCHAR(10)   NOT NULL DEFAULT 'USD',
  active         BOOLEAN       NOT NULL DEFAULT TRUE,
  plan           VARCHAR(20)   NOT NULL DEFAULT 'basic',
  pending_review BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------
-- 2. CLIENTES
-- -------------------------------------------------------------
CREATE TABLE customers (
  id            SERIAL        PRIMARY KEY,
  identity_card VARCHAR(20)   UNIQUE NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  phone         VARCHAR(20),
  address       TEXT,
  tenant_id     INTEGER       NOT NULL REFERENCES tenants(id),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------
-- 3. PRODUCTOS
-- -------------------------------------------------------------
CREATE TABLE products (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock       INTEGER       DEFAULT 0 CHECK (stock >= 0),
  tenant_id   INTEGER       NOT NULL REFERENCES tenants(id),
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------
-- 4. ADMINISTRADORES
--    tenant_id es NULL para platform_admin
-- -------------------------------------------------------------
CREATE TABLE admins (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(100)  UNIQUE NOT NULL,
  password    TEXT          NOT NULL,
  role        VARCHAR(20)   DEFAULT 'admin',
  active      BOOLEAN       NOT NULL DEFAULT TRUE,
  permissions TEXT[]        NOT NULL DEFAULT ARRAY['customers','products','shopping','sales','payments','audit']::TEXT[],
  tenant_id   INTEGER       REFERENCES tenants(id),
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------
-- 5. VENTAS
-- -------------------------------------------------------------
CREATE TABLE sales (
  id            SERIAL        PRIMARY KEY,
  customer_id   INTEGER       REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  total         NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status        VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  cuotas        INTEGER       NOT NULL DEFAULT 1,
  sale_date     DATE          NOT NULL DEFAULT CURRENT_DATE,
  currency      VARCHAR(3)    NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(12,4) DEFAULT NULL,
  tenant_id     INTEGER       NOT NULL REFERENCES tenants(id),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------
-- 6. DETALLE DE VENTAS
-- -------------------------------------------------------------
CREATE TABLE sale_details (
  id          SERIAL        PRIMARY KEY,
  sale_id     INTEGER       NOT NULL REFERENCES sales(id)    ON DELETE CASCADE ON UPDATE CASCADE,
  product_id  INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  tenant_id   INTEGER       NOT NULL REFERENCES tenants(id),
  CONSTRAINT unique_product_per_sale UNIQUE (sale_id, product_id)
);


-- -------------------------------------------------------------
-- 7. PAGOS
-- -------------------------------------------------------------
CREATE TABLE payments (
  id            SERIAL        PRIMARY KEY,
  sale_id       INTEGER       NOT NULL REFERENCES sales(id) ON DELETE CASCADE ON UPDATE CASCADE,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_date  DATE,
  method        VARCHAR(20)   CHECK (method IN ('cash','transfer','card')),
  currency      VARCHAR(3)    NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(12,4) DEFAULT NULL,
  tenant_id     INTEGER       NOT NULL REFERENCES tenants(id)
);


-- -------------------------------------------------------------
-- 8. COMPRAS
-- -------------------------------------------------------------
CREATE TABLE shopping (
  id          SERIAL        PRIMARY KEY,
  product_id  INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  cost        NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
  date        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  currency    VARCHAR(3)    NOT NULL DEFAULT 'USD',
  tenant_id   INTEGER       NOT NULL REFERENCES tenants(id)
);


-- -------------------------------------------------------------
-- 9. AUDITORÍA
--    tenant_id nullable: platform_admin puede generar logs sin tenant
-- -------------------------------------------------------------
CREATE TABLE audit_logs (
  id          SERIAL      PRIMARY KEY,
  admin_id    INTEGER     REFERENCES admins(id) ON DELETE SET NULL ON UPDATE CASCADE,
  action      VARCHAR(20) CHECK (action IN ('CREATE','UPDATE','DELETE')),
  table_name  VARCHAR(50) NOT NULL,
  record_id   INTEGER,
  description TEXT,
  tenant_id   INTEGER     REFERENCES tenants(id),
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------
-- 10. CIERRES MENSUALES (Contabilidad)
-- -------------------------------------------------------------
CREATE TABLE monthly_closings (
  id         SERIAL      PRIMARY KEY,
  year       INTEGER     NOT NULL,
  month      INTEGER     NOT NULL,
  notas      TEXT,
  cerrado    BOOLEAN     NOT NULL DEFAULT FALSE,
  tenant_id  INTEGER     REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT monthly_closings_year_month_tenant_key UNIQUE (year, month, tenant_id)
);


-- -------------------------------------------------------------
-- 11. PLANES
-- -------------------------------------------------------------
CREATE TABLE plan_configs (
  plan        VARCHAR(20) PRIMARY KEY,
  max_admins  INTEGER     NOT NULL DEFAULT -1,
  modules     TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------
-- 12. TOKENS DE RECUPERACIÓN DE CONTRASEÑA
-- -------------------------------------------------------------
CREATE TABLE password_reset_tokens (
  id         SERIAL      PRIMARY KEY,
  admin_id   INTEGER     NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token      VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------
-- 13. FUNCIONES Y TRIGGERS DE STOCK
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION increase_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increase_stock
AFTER INSERT ON shopping
FOR EACH ROW EXECUTE FUNCTION increase_stock();

CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
DECLARE current_stock INTEGER;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = NEW.product_id;
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto ID %', NEW.product_id;
  END IF;
  UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_stock
BEFORE INSERT ON sale_details
FOR EACH ROW EXECUTE FUNCTION decrease_stock();


-- -------------------------------------------------------------
-- 14. ÍNDICES
-- -------------------------------------------------------------
CREATE INDEX idx_sales_customer          ON sales(customer_id);
CREATE INDEX idx_payments_sale           ON payments(sale_id);
CREATE INDEX idx_sale_details_sale       ON sale_details(sale_id);
CREATE INDEX idx_sale_details_product    ON sale_details(product_id);
CREATE INDEX idx_shopping_product        ON shopping(product_id);
CREATE INDEX idx_customers_tenant        ON customers(tenant_id);
CREATE INDEX idx_products_tenant         ON products(tenant_id);
CREATE INDEX idx_sales_tenant            ON sales(tenant_id);
CREATE INDEX idx_sale_details_tenant     ON sale_details(tenant_id);
CREATE INDEX idx_payments_tenant         ON payments(tenant_id);
CREATE INDEX idx_shopping_tenant         ON shopping(tenant_id);
CREATE INDEX idx_audit_tenant            ON audit_logs(tenant_id);
CREATE INDEX idx_monthly_closings_tenant ON monthly_closings(tenant_id);


-- -------------------------------------------------------------
-- 15. DATOS INICIALES
-- -------------------------------------------------------------

-- Planes
INSERT INTO plan_configs (plan, max_admins, modules) VALUES
  ('basic', 2,  ARRAY['customers','products','sales','payments']::TEXT[]),
  ('pro',   -1, ARRAY['customers','products','shopping','sales','payments','earnings','audit']::TEXT[]);

-- Tenant inicial: CrediShoping
INSERT INTO tenants (name, slug, currency, plan)
VALUES ('CrediShoping', 'credishoping', 'USD', 'pro');

-- Platform admin  (contraseña: Admin123!)
INSERT INTO admins (name, email, password, role, active, tenant_id)
VALUES (
  'Kreditfy Admin',
  'admin@kreditfy.com',
  '$2b$10$WgS9d/EEczvpOJPp2oLaS.QVJ3nrrl59Khox3rJ1rfzdFxcsR8pya',
  'platform_admin',
  TRUE,
  NULL
);


-- -------------------------------------------------------------
-- VERIFICACIÓN
-- -------------------------------------------------------------
SELECT 'tenants'          AS tabla, COUNT(*) FROM tenants
UNION ALL
SELECT 'admins',                    COUNT(*) FROM admins
UNION ALL
SELECT 'plan_configs',              COUNT(*) FROM plan_configs;
