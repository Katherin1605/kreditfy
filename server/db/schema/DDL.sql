CREATE DATABASE kreditfy;

-- =========================================
-- CUSTOMERS
-- =========================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    identity_card VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- PRODUCTS
-- =========================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- ADMINS
-- =========================================

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- SALES
-- =========================================

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- =========================================
-- SALE DETAILS
-- =========================================

CREATE TABLE sale_details (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),

    CONSTRAINT fk_sale_details_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sale_details_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT unique_product_per_sale
        UNIQUE (sale_id, product_id)
);


-- =========================================
-- PAYMENTS
-- =========================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(20)
        CHECK (method IN ('cash','transfer','card')),

    CONSTRAINT fk_payments_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================
-- SHOPPING (COMPRAS DE PRODUCTOS)
-- =========================================

CREATE TABLE shopping (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shopping_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================
-- AUDIT LOGS
-- =========================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    action VARCHAR(20)
        CHECK (action IN ('CREATE','UPDATE','DELETE')),
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- =========================================
-- INDEXES (MEJORAN RENDIMIENTO)
-- =========================================

CREATE INDEX idx_sales_customer
ON sales(customer_id);

CREATE INDEX idx_payments_sale
ON payments(sale_id);

CREATE INDEX idx_sale_details_sale
ON sale_details(sale_id);

CREATE INDEX idx_sale_details_product
ON sale_details(product_id);

CREATE INDEX idx_shopping_product
ON shopping(product_id);

-- =========================================
-- FUNCIÓN: AUMENTAR STOCK (COMPRAS)
-- =========================================

CREATE OR REPLACE FUNCTION increase_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock + NEW.quantity
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================
-- TRIGGER: CUANDO SE INSERTA COMPRA
-- =========================================

CREATE TRIGGER trigger_increase_stock
AFTER INSERT ON shopping
FOR EACH ROW
EXECUTE FUNCTION increase_stock();


-- =========================================
-- FUNCIÓN: DISMINUIR STOCK (VENTAS) + VALIDACIÓN
-- =========================================

CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Obtener stock actual
  SELECT stock INTO current_stock
  FROM products
  WHERE id = NEW.product_id;

  -- Validar si hay suficiente stock
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto ID %', NEW.product_id;
  END IF;

  -- Descontar stock
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================
-- TRIGGER: ANTES DE INSERTAR DETALLE DE VENTA
-- =========================================

CREATE TRIGGER trigger_decrease_stock
BEFORE INSERT ON sale_details
FOR EACH ROW
EXECUTE FUNCTION decrease_stock();