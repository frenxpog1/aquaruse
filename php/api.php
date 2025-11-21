<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aquaruse";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

try {
    switch ($method) {
        case 'GET':
            handleGet($conn, $action);
            break;
        case 'POST':
            handlePost($conn, $action);
            break;
        case 'PUT':
            handlePut($conn, $action);
            break;
        case 'DELETE':
            handleDelete($conn, $action);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    $conn->close();
}

function handleGet($conn, $action) {
    switch ($action) {
        case 'orders':
            $sql = "SELECT * FROM orders ORDER BY DATE DESC";
            $result = $conn->query($sql);
            $orders = [];
            while ($row = $result->fetch_assoc()) {
                $orders[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $orders]);
            break;

        case 'customers':
            $sql = "SELECT * FROM customers ORDER BY name ASC";
            $result = $conn->query($sql);
            $customers = [];
            while ($row = $result->fetch_assoc()) {
                $customers[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $customers]);
            break;

        case 'supplies':
            $sql = "SELECT * FROM supplies ORDER BY name ASC";
            $result = $conn->query($sql);
            $supplies = [];
            while ($row = $result->fetch_assoc()) {
                $supplies[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $supplies]);
            break;

        case 'accounts':
            $sql = "SELECT id, account_name, email FROM accounts ORDER BY account_name ASC";
            $result = $conn->query($sql);
            $accounts = [];
            while ($row = $result->fetch_assoc()) {
                $accounts[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $accounts]);
            break;

        case 'staff':
            $sql = "SELECT id, name, email, phone FROM staff ORDER BY name ASC";
            $result = $conn->query($sql);
            $staff = [];
            while ($row = $result->fetch_assoc()) {
                $staff[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $staff]);
            break;

        case 'user_settings':
            $email = isset($_GET['email']) ? $conn->real_escape_string($_GET['email']) : '';
            if ($email) {
                $sql = "SELECT * FROM user_settings WHERE email='$email'";
                $result = $conn->query($sql);
                if ($result && $result->num_rows > 0) {
                    $settings = $result->fetch_assoc();
                    echo json_encode(['success' => true, 'data' => $settings]);
                } else {
                    echo json_encode(['success' => true, 'data' => null]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Email required']);
            }
            break;

        case 'search_customers':
            $query = isset($_GET['query']) ? $conn->real_escape_string($_GET['query']) : '';
            if ($query) {
                $sql = "SELECT DISTINCT name, phone_numbers FROM customers WHERE name LIKE '%$query%' ORDER BY name ASC LIMIT 10";
                $result = $conn->query($sql);
                $customers = [];
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $customers[] = [
                            'name' => $row['name'],
                            'phone' => $row['phone_numbers']
                        ];
                    }
                }
                echo json_encode(['success' => true, 'data' => $customers]);
            } else {
                echo json_encode(['success' => true, 'data' => []]);
            }
            break;

        case 'health':
            echo json_encode([
                'success' => true, 
                'status' => 'healthy',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '2.0'
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
}

function handlePost($conn, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    switch ($action) {
        case 'login':
            $email = isset($input['email']) ? $input['email'] : '';
            $password = isset($input['password']) ? $input['password'] : '';
            
            // Admin login
            if ($email === 'admin@aquaruse') {
                echo json_encode(['success' => true, 'role' => 'admin', 'name' => 'Admin User']);
                break;
            }
            
            // Staff login
            $email = $conn->real_escape_string($email);
            $password = $conn->real_escape_string($password);
            $sql = "SELECT * FROM staff WHERE email='$email' AND password='$password'";
            $result = $conn->query($sql);
            
            if ($result && $result->num_rows > 0) {
                $user = $result->fetch_assoc();
                echo json_encode([
                    'success' => true, 
                    'role' => 'staff', 
                    'name' => $user['name'],
                    'id' => $user['id']
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
            }
            break;

        case 'add_order':
            $order = [
                'order_id' => $conn->real_escape_string($input['order_id']),
                'name' => $conn->real_escape_string($input['customer_name']),
                'date' => $conn->real_escape_string($input['date']),
                'service_type' => $conn->real_escape_string($input['service_type']),
                'kg' => floatval($input['kg']),
                'total_amount' => floatval($input['total_amount']),
                'amount_paid' => floatval($input['amount_paid']),
                'balance' => floatval($input['balance']),
                'status' => $conn->real_escape_string($input['status']),
                'number' => $conn->real_escape_string($input['number'])
            ];

            $sql = "INSERT INTO orders (order_id, name, DATE, service_type, kg, total_amount, amount_paid, balance, status, number) 
                    VALUES ('{$order['order_id']}', '{$order['name']}', '{$order['date']}', '{$order['service_type']}', 
                    {$order['kg']}, {$order['total_amount']}, {$order['amount_paid']}, {$order['balance']}, 
                    '{$order['status']}', '{$order['number']}')";

            if ($conn->query($sql)) {
                // Handle customer - add or update customer record
                handleCustomer($conn, $order['name'], $order['number']);
                echo json_encode(['success' => true, 'message' => 'Order added successfully']);
            } else {
                throw new Exception('Failed to add order: ' . $conn->error);
            }
            break;

        case 'add_staff':
            $staff = [
                'name' => $conn->real_escape_string($input['name']),
                'email' => $conn->real_escape_string($input['email']),
                'phone' => $conn->real_escape_string($input['phone']),
                'password' => $conn->real_escape_string($input['password'])
            ];

            $sql = "INSERT INTO staff (name, email, phone, password) VALUES ('{$staff['name']}', '{$staff['email']}', '{$staff['phone']}', '{$staff['password']}')";
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Staff added successfully']);
            } else {
                throw new Exception('Failed to add staff: ' . $conn->error);
            }
            break;

        case 'save_user_settings':
            $email = $conn->real_escape_string($input['email']);
            $settings = [
                'display_name' => $conn->real_escape_string($input['display_name']),
                'theme' => $conn->real_escape_string($input['theme']),
                'notifications' => $conn->real_escape_string($input['notifications']),
                'auto_logout' => intval($input['auto_logout']),
                'profile_picture' => isset($input['profile_picture']) ? $input['profile_picture'] : null
            ];

            // Check if settings exist
            $check_sql = "SELECT * FROM user_settings WHERE email='$email'";
            $result = $conn->query($check_sql);

            if ($result && $result->num_rows > 0) {
                // Update existing settings
                $sql = "UPDATE user_settings SET 
                        display_name='{$settings['display_name']}', 
                        theme='{$settings['theme']}', 
                        notifications='{$settings['notifications']}', 
                        auto_logout={$settings['auto_logout']}, 
                        profile_picture='" . ($settings['profile_picture'] ? $conn->real_escape_string($settings['profile_picture']) : '') . "',
                        updated_at=NOW()
                        WHERE email='$email'";
            } else {
                // Insert new settings
                $sql = "INSERT INTO user_settings (email, display_name, theme, notifications, auto_logout, profile_picture, created_at, updated_at) 
                        VALUES ('$email', '{$settings['display_name']}', '{$settings['theme']}', '{$settings['notifications']}', 
                        {$settings['auto_logout']}, '" . ($settings['profile_picture'] ? $conn->real_escape_string($settings['profile_picture']) : '') . "', NOW(), NOW())";
            }

            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
            } else {
                throw new Exception('Failed to save settings: ' . $conn->error);
            }
            break;

        case 'change_password':
            $email = $conn->real_escape_string($input['email']);
            $current_password = $conn->real_escape_string($input['current_password']);
            $new_password = $conn->real_escape_string($input['new_password']);

            // Verify current password
            $sql = "SELECT * FROM staff WHERE email='$email' AND password='$current_password'";
            $result = $conn->query($sql);

            if ($result && $result->num_rows > 0) {
                // Update password
                $update_sql = "UPDATE staff SET password='$new_password' WHERE email='$email'";
                if ($conn->query($update_sql)) {
                    echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
                } else {
                    throw new Exception('Failed to update password');
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Current password is incorrect']);
            }
            break;

        case 'clear_all_data':
            // Admin only operation
            if (!isset($input['admin_email']) || $input['admin_email'] !== 'admin@aquaruse') {
                http_response_code(403);
                echo json_encode(['error' => 'Admin access required']);
                break;
            }

            // Clear all tables
            $tables = ['orders', 'customers', 'staff', 'supplies', 'accounts', 'user_settings'];
            $success = true;
            $errors = [];

            foreach ($tables as $table) {
                $sql = "DELETE FROM $table";
                if (!$conn->query($sql)) {
                    $success = false;
                    $errors[] = "Failed to clear $table: " . $conn->error;
                }
            }

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'All data cleared successfully']);
            } else {
                echo json_encode(['success' => false, 'errors' => $errors]);
            }
            break;

        case 'reset_to_sample_data':
            // Admin only operation
            if (!isset($input['admin_email']) || $input['admin_email'] !== 'admin@aquaruse') {
                http_response_code(403);
                echo json_encode(['error' => 'Admin access required']);
                break;
            }

            // Clear existing data first
            $tables = ['orders', 'customers', 'staff', 'supplies', 'accounts'];
            foreach ($tables as $table) {
                $conn->query("DELETE FROM $table");
            }

            // Insert sample data with proper error handling
            $sample_queries = [
                // Orders
                "INSERT INTO orders (order_id, name, DATE, service_type, kg, total_amount, amount_paid, balance, status, number) VALUES
                ('00001', 'John Doe', CURDATE(), 'Dry Cleaning', 5.0, 250.00, 250.00, 0.00, 'completed', '09123456789'),
                ('00002', 'Jane Smith', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Wash and Fold', 3.0, 150.00, 100.00, 50.00, 'ongoing', '09187654321'),
                ('00003', 'Bob Wilson', DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'Regular Laundry', 2.0, 120.00, 0.00, 120.00, 'pending', '09156789012'),
                ('00004', 'John Doe', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Iron and Press', 1.0, 70.00, 70.00, 0.00, 'completed', '09123456789'),
                ('00005', 'Maria Garcia', CURDATE(), 'Wash and Fold', 4.0, 200.00, 150.00, 50.00, 'ongoing', '09198765432')",

                // Staff
                "INSERT INTO staff (name, email, phone, password) VALUES
                ('Sarah Wilson', 'sarah@aquaruse.com', '09111111111', 'sarah123'),
                ('Mike Chen', 'mike@aquaruse.com', '09222222222', 'mike123')",

                // Supplies
                "INSERT INTO supplies (name, quantity, unit, low_stock_threshold) VALUES
                ('detergent', 25, 'bottles', 5),
                ('softener', 20, 'bottles', 3),
                ('bleach', 15, 'bottles', 2),
                ('fragrance', 18, 'bottles', 5),
                ('stain_remover', 12, 'bottles', 3),
                ('steam_water', 25, 'liters', 5),
                ('garment_bag', 100, 'pcs', 20)",

                // Accounts
                "INSERT INTO accounts (account_name, email, password) VALUES
                ('Admin User', 'admin@aquaruse', 'admin123'),
                ('Staff Manager', 'staffmanager@aquaruse', 'staff123')"
            ];

            $success = true;
            $errors = [];

            foreach ($sample_queries as $query) {
                if (!$conn->query($query)) {
                    $success = false;
                    $errors[] = $conn->error;
                }
            }

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Sample data reset successfully']);
            } else {
                echo json_encode(['success' => false, 'errors' => $errors]);
            }
            break;

        case 'init_database':
            // Initialize database with sample data if empty
            $check_sql = "SELECT COUNT(*) as count FROM orders";
            $result = $conn->query($check_sql);
            $row = $result->fetch_assoc();
            
            if ($row['count'] == 0) {
                // Database is empty, insert sample data
                $sample_queries = [
                    "INSERT INTO orders (order_id, name, DATE, service_type, kg, total_amount, amount_paid, balance, status, number) VALUES
                    ('00001', 'John Doe', CURDATE(), 'Dry Cleaning', 5.0, 250.00, 250.00, 0.00, 'completed', '09123456789'),
                    ('00002', 'Jane Smith', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Wash and Fold', 3.0, 150.00, 100.00, 50.00, 'ongoing', '09187654321')",
                    
                    "INSERT INTO staff (name, email, phone, password) VALUES
                    ('Sarah Wilson', 'sarah@aquaruse.com', '09111111111', 'sarah123')",
                    
                    "INSERT INTO supplies (name, quantity, unit, low_stock_threshold) VALUES
                    ('detergent', 25, 'bottles', 5),
                    ('softener', 20, 'bottles', 3),
                    ('bleach', 15, 'bottles', 2),
                    ('fragrance', 18, 'bottles', 5),
                    ('stain_remover', 12, 'bottles', 3),
                    ('steam_water', 25, 'liters', 5),
                    ('garment_bag', 100, 'pcs', 20)"
                ];
                
                foreach ($sample_queries as $query) {
                    $conn->query($query);
                }
                
                echo json_encode(['success' => true, 'message' => 'Database initialized with sample data']);
            } else {
                echo json_encode(['success' => true, 'message' => 'Database already has data']);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
}

function handlePut($conn, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'update_order':
            $order_id = $conn->real_escape_string($input['order_id']);
            $order = [
                'name' => $conn->real_escape_string($input['customer_name']),
                'date' => $conn->real_escape_string($input['date']),
                'service_type' => $conn->real_escape_string($input['service_type']),
                'kg' => floatval($input['kg']),
                'total_amount' => floatval($input['total_amount']),
                'amount_paid' => floatval($input['amount_paid']),
                'balance' => floatval($input['balance']),
                'status' => $conn->real_escape_string($input['status']),
                'number' => $conn->real_escape_string($input['number'])
            ];

            $sql = "UPDATE orders SET 
                    name='{$order['name']}', 
                    DATE='{$order['date']}', 
                    service_type='{$order['service_type']}', 
                    kg={$order['kg']}, 
                    total_amount={$order['total_amount']}, 
                    amount_paid={$order['amount_paid']}, 
                    balance={$order['balance']}, 
                    status='{$order['status']}', 
                    number='{$order['number']}'
                    WHERE order_id='$order_id'";

            if ($conn->query($sql)) {
                handleCustomer($conn, $order['name'], $order['number']);
                echo json_encode(['success' => true, 'message' => 'Order updated successfully']);
            } else {
                throw new Exception('Failed to update order: ' . $conn->error);
            }
            break;

        case 'update_supply':
            $name = $conn->real_escape_string($input['name']);
            $quantity = intval($input['quantity']);
            
            $sql = "UPDATE supplies SET quantity=$quantity WHERE name='$name'";
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Supply updated successfully']);
            } else {
                throw new Exception('Failed to update supply: ' . $conn->error);
            }
            break;

        case 'staff':
            // Update staff member
            $staff = [
                'name' => $conn->real_escape_string($input['name']),
                'email' => $conn->real_escape_string($input['email']),
                'phone' => $conn->real_escape_string($input['phone']),
                'password' => $conn->real_escape_string($input['password'])
            ];

            // Find staff by id or email
            if (isset($input['id'])) {
                $identifier = "id=" . intval($input['id']);
            } else {
                $old_email = $conn->real_escape_string($input['email']);
                $identifier = "email='$old_email'";
            }

            $sql = "UPDATE staff SET 
                    name='{$staff['name']}', 
                    email='{$staff['email']}', 
                    phone='{$staff['phone']}', 
                    password='{$staff['password']}'
                    WHERE $identifier";

            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Staff updated successfully']);
            } else {
                throw new Exception('Failed to update staff: ' . $conn->error);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
}

function handleDelete($conn, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'delete_order':
            $order_id = $conn->real_escape_string($input['order_id']);
            $sql = "DELETE FROM orders WHERE order_id='$order_id'";
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Order deleted successfully']);
            } else {
                throw new Exception('Failed to delete order: ' . $conn->error);
            }
            break;

        case 'delete_account':
            $id = intval($input['id']);
            $sql = "DELETE FROM accounts WHERE id=$id";
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Account deleted successfully']);
            } else {
                throw new Exception('Failed to delete account: ' . $conn->error);
            }
            break;

        case 'staff':
            // Delete staff member by id or email
            if (isset($input['id'])) {
                $id = intval($input['id']);
                $sql = "DELETE FROM staff WHERE id=$id";
            } else if (isset($input['email'])) {
                $email = $conn->real_escape_string($input['email']);
                $sql = "DELETE FROM staff WHERE email='$email'";
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Staff id or email required']);
                break;
            }
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'message' => 'Staff deleted successfully']);
            } else {
                throw new Exception('Failed to delete staff: ' . $conn->error);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
}

function handleCustomer($conn, $name, $phone) {
    $name = $conn->real_escape_string($name);
    $phone = $conn->real_escape_string($phone);
    
    // Check if customer with same name and phone already exists
    $check_sql = "SELECT * FROM customers WHERE name='$name' AND phone_numbers='$phone'";
    $result = $conn->query($check_sql);
    
    if ($result && $result->num_rows > 0) {
        // Customer exists, mark as returning
        $update_sql = "UPDATE customers SET is_returning=1, updated_at=NOW() WHERE name='$name' AND phone_numbers='$phone'";
        $conn->query($update_sql);
    } else {
        // Check if customer with same name exists (but different phone)
        $check_name_sql = "SELECT * FROM customers WHERE name='$name'";
        $name_result = $conn->query($check_name_sql);
        
        if ($name_result && $name_result->num_rows > 0) {
            // Customer name exists with different phone, still add new record but mark as returning
            $insert_sql = "INSERT INTO customers (name, phone_numbers, is_returning) VALUES ('$name', '$phone', 1)";
        } else {
            // Completely new customer
            $insert_sql = "INSERT INTO customers (name, phone_numbers, is_returning) VALUES ('$name', '$phone', 0)";
        }
        $conn->query($insert_sql);
    }
}
?>