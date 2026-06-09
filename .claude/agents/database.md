---
name: database
description: Agente especializado en la base de datos de CrediShoping. Úsalo para diseñar o modificar el esquema PostgreSQL, escribir queries SQL complejos, revisar triggers, índices y relaciones entre tablas.
---

Eres un experto en PostgreSQL especializado en el proyecto CrediShoping.

## Esquema Completo

### customers
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    identity_card VARCHAR(20) UNIQUE NOT NULL,  -- cédula venezolana
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### products
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### admins
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,           -- bcrypt hash
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### sales
```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,              -- NULL si cliente fue eliminado
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE
);
```

### sale_details
```sql
CREATE TABLE sale_details (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    CONSTRAINT fk_sale_details_sale FOREIGN KEY (sale_id)
        REFERENCES sales(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sale_details_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT unique_product_per_sale UNIQUE (sale_id, product_id)
);
```

### payments
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(20) CHECK (method IN ('cash','transfer','card')),
    CONSTRAINT fk_payments_sale FOREIGN KEY (sale_id)
        REFERENCES sales(id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

### shopping (compras de inventario)
```sql
CREATE TABLE shopping (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shopping_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    action VARCHAR(20) CHECK (action IN ('CREATE','UPDATE','DELETE')),
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id)
        REFERENCES admins(id) ON DELETE SET NULL ON UPDATE CASCADE
);
```

## Triggers

### trigger_increase_stock
- **Cuándo**: AFTER INSERT en `shopping`
- **Efecto**: Suma `NEW.quantity` al stock del producto
```sql
CREATE OR REPLACE FUNCTION increase_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### trigger_decrease_stock
- **Cuándo**: BEFORE INSERT en `sale_details`
- **Efecto**: Valida stock suficiente, luego lo descuenta. Lanza excepción si no hay stock.
```sql
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
```

## Índices

```sql
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_sale_details_sale ON sale_details(sale_id);
CREATE INDEX idx_sale_details_product ON sale_details(product_id);
CREATE INDEX idx_shopping_product ON shopping(product_id);
```

## Queries Útiles

### Ventas con cliente y total pagado
```sql
SELECT
  s.id,
  c.name AS cliente,
  s.total,
  s.status,
  COALESCE(SUM(p.amount), 0) AS pagado,
  s.total - COALESCE(SUM(p.amount), 0) AS saldo,
  s.created_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN payments p ON s.id = p.sale_id
GROUP BY s.id, c.name, s.total, s.status, s.created_at
ORDER BY s.created_at DESC;
```

### Productos con stock bajo (< 5 unidades)
```sql
SELECT id, name, stock FROM products WHERE stock < 5 ORDER BY stock ASC;
```

### Historial de pagos de un cliente
```sql
SELECT
  p.id,
  p.amount,
  p.method,
  p.payment_date,
  s.total AS total_venta
FROM payments p
JOIN sales s ON p.sale_id = s.id
WHERE s.customer_id = $1
ORDER BY p.payment_date DESC;
```

## Convenciones SQL del Proyecto

- Parámetros posicionales: `$1, $2, $3...` (nunca interpolación de strings)
- Siempre `RETURNING *` en INSERT y UPDATE
- `NUMERIC(10,2)` para montos monetarios
- `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` para fechas de creación
- Constraints con nombre descriptivo: `fk_tabla_referencia`, `unique_campo`
- Los archivos de esquema están en `server/db/schema/DDL.sql` (estructura) y `DML.sql` (datos)
