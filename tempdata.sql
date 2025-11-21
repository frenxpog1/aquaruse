-- TEMPDATA - Sample Data for Aquaruse Laundry System
-- Run this file to insert sample data into your database
-- Data will persist until manually deleted

USE aquaruse;

-- OPTION 1: Clear all existing data first (uncomment the section below to reset everything)
/*
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM staff;
DELETE FROM supplies;
DELETE FROM accounts;
DELETE FROM user_settings;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE customers AUTO_INCREMENT = 1;
ALTER TABLE staff AUTO_INCREMENT = 1;
ALTER TABLE supplies AUTO_INCREMENT = 1;
ALTER TABLE accounts AUTO_INCREMENT = 1;
ALTER TABLE user_settings AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;
*/

-- Insert sample orders
INSERT INTO orders (order_id, name, DATE, service_type, kg, total_amount, amount_paid, balance, status, number) VALUES
('00001', 'John Doe', CURDATE(), 'Dry Cleaning', 5.0, 250.00, 250.00, 0.00, 'completed', '09123456789'),
('00002', 'Jane Smith', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Wash and Fold', 3.0, 150.00, 100.00, 50.00, 'ongoing', '09187654321'),
('00003', 'Bob Wilson', DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'Regular Laundry', 2.0, 120.00, 0.00, 120.00, 'pending', '09156789012'),
('00004', 'John Doe', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Iron and Press', 1.0, 70.00, 70.00, 0.00, 'completed', '09123456789'),
('00005', 'Maria Garcia', CURDATE(), 'Wash and Fold', 4.0, 200.00, 150.00, 50.00, 'ongoing', '09198765432');

-- Insert sample customers
INSERT INTO customers (name, phone_numbers, is_returning) VALUES
('John Doe', '09123456789', 1),
('Jane Smith', '09187654321', 0),
('Bob Wilson', '09156789012', 0),
('Maria Garcia', '09198765432', 0);

-- Insert sample staff
INSERT INTO staff (name, email, phone, password) VALUES
('Sarah Wilson', 'sarah@aquaruse.com', '09111111111', 'sarah123'),
('Mike Chen', 'mike@aquaruse.com', '09222222222', 'mike123');

-- Insert supplies with quantities (will update if exists, insert if not)
INSERT INTO supplies (name, quantity, unit, low_stock_threshold) VALUES
('detergent', 25, 'bottles', 5),
('softener', 20, 'bottles', 3),
('bleach', 15, 'bottles', 2),
('fragrance', 18, 'bottles', 5),
('stain_remover', 12, 'bottles', 3),
('steam_water', 25, 'liters', 5),
('garment_bag', 100, 'pcs', 20)
ON DUPLICATE KEY UPDATE 
quantity = VALUES(quantity),
unit = VALUES(unit),
low_stock_threshold = VALUES(low_stock_threshold);

-- Insert admin accounts
INSERT IGNORE INTO accounts (account_name, email, password) VALUES
('Admin User', 'admin@aquaruse', 'admin123'),
('Staff Manager', 'staffmanager@aquaruse', 'staff123');