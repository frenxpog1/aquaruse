<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $servername = 'localhost';
    $username = 'root';
    $password = '';
    $dbname = 'aquaruse';
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        http_response_code(500);
        exit('Connection failed');
    }
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    if ($action === 'add') {
        $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : '';
        $password_input = isset($_POST['password']) ? $conn->real_escape_string($_POST['password']) : '';
        $account_name = isset($_POST['account_name']) ? $conn->real_escape_string($_POST['account_name']) : '';
        if ($email && $password_input) {
            $sql = "INSERT INTO accounts (account_name, email, password) VALUES ('$account_name', '$email', '$password_input')";
            if ($conn->query($sql) === TRUE) {
                echo 'success';
            } else {
                http_response_code(500);
                echo 'error';
            }
        } else {
            http_response_code(400);
            echo 'missing_fields';
        }
        $conn->close();
        exit;
    } else if ($action === 'delete') {
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        if ($id > 0) {
            $sql = "DELETE FROM accounts WHERE id=$id";
            if ($conn->query($sql) === TRUE) {
                echo 'success';
            } else {
                http_response_code(500);
                echo 'error';
            }
        } else {
            http_response_code(400);
            echo 'missing_id';
        }
        $conn->close();
        exit;
    } else if ($action === 'add_order') {
        $order_id = isset($_POST['order_id']) ? $conn->real_escape_string($_POST['order_id']) : '';
        $date = isset($_POST['date']) ? $conn->real_escape_string($_POST['date']) : '';
        $service_type = isset($_POST['service_type']) ? $conn->real_escape_string($_POST['service_type']) : '';
        $kg = isset($_POST['kg']) ? floatval($_POST['kg']) : 0;
        $total_amount = isset($_POST['total_amount']) ? floatval($_POST['total_amount']) : 0;
        $amount_paid = isset($_POST['amount_paid']) ? floatval($_POST['amount_paid']) : 0;
        $balance = isset($_POST['balance']) ? floatval($_POST['balance']) : 0;
        $status = isset($_POST['status']) ? $conn->real_escape_string($_POST['status']) : '';
        $customer_name = isset($_POST['customer_name']) ? $conn->real_escape_string($_POST['customer_name']) : '';
        $number = isset($_POST['number']) ? $conn->real_escape_string($_POST['number']) : '';
        if ($order_id && $date && $service_type) {
            $sql = "INSERT INTO orders (order_id, name, DATE, service_type, kg, total_amount, amount_paid, balance, status, number) VALUES ('$order_id', '$customer_name', '$date', '$service_type', $kg, $total_amount, $amount_paid, $balance, '$status', '$number')";
            if ($conn->query($sql) === TRUE) {
                // Customer logic
                $check_customer = "SELECT * FROM customers WHERE name='$customer_name' AND phone_numbers='$number'";
                $result = $conn->query($check_customer);
                if ($result && $result->num_rows > 0) {
                    $update_customer = "UPDATE customers SET is_returning=1 WHERE name='$customer_name' AND phone_numbers='$number'";
                    $conn->query($update_customer);
                } else {
                    $insert_customer = "INSERT INTO customers (name, phone_numbers, is_returning) VALUES ('$customer_name', '$number', 0)";
                    $conn->query($insert_customer);
                }
                echo 'success';
            } else {
                http_response_code(500);
                echo 'error';
            }
        } else {
            http_response_code(400);
            echo 'missing_fields';
        }
        $conn->close();
        exit;
    } else if ($action === 'delete_order') {
        $order_id = isset($_POST['order_id']) ? $conn->real_escape_string($_POST['order_id']) : '';
        if ($order_id) {
            $sql = "DELETE FROM orders WHERE order_id='$order_id'";
            if ($conn->query($sql) === TRUE) {
                echo 'success';
            } else {
                http_response_code(500);
                echo 'error';
            }
        } else {
            http_response_code(400);
            echo 'missing_order_id';
        }
        $conn->close();
        exit;
    } else if ($action === 'update_order') {
        $order_id = isset($_POST['order_id']) ? $conn->real_escape_string($_POST['order_id']) : '';
        $date = isset($_POST['date']) ? $conn->real_escape_string($_POST['date']) : '';
        $service_type = isset($_POST['service_type']) ? $conn->real_escape_string($_POST['service_type']) : '';
        $kg = isset($_POST['kg']) ? floatval($_POST['kg']) : 0;
        $total_amount = isset($_POST['total_amount']) ? floatval($_POST['total_amount']) : 0;
        $amount_paid = isset($_POST['amount_paid']) ? floatval($_POST['amount_paid']) : 0;
        $balance = isset($_POST['balance']) ? floatval($_POST['balance']) : 0;
        $status = isset($_POST['status']) ? $conn->real_escape_string($_POST['status']) : '';
        $customer_name = isset($_POST['customer_name']) ? $conn->real_escape_string($_POST['customer_name']) : '';
        $number = isset($_POST['number']) ? $conn->real_escape_string($_POST['number']) : '';
        if ($order_id && $date && $service_type) {
            $sql = "UPDATE orders SET name='$customer_name', DATE='$date', service_type='$service_type', kg=$kg, total_amount=$total_amount, amount_paid=$amount_paid, balance=$balance, status='$status', number='$number' WHERE order_id='$order_id'";
            if ($conn->query($sql) === TRUE) {
                // Customer logic
                $check_customer = "SELECT * FROM customers WHERE name='$customer_name' AND phone_numbers='$number'";
                $result = $conn->query($check_customer);
                if ($result && $result->num_rows > 0) {
                    $update_customer = "UPDATE customers SET is_returning=1 WHERE name='$customer_name' AND phone_numbers='$number'";
                    $conn->query($update_customer);
                } else {
                    $insert_customer = "INSERT INTO customers (name, phone_numbers, is_returning) VALUES ('$customer_name', '$number', 0)";
                    $conn->query($insert_customer);
                }
                echo 'success';
            } else {
                http_response_code(500);
                echo 'error';
            }
        } else {
            http_response_code(400);
            echo 'missing_fields';
        }
        $conn->close();
        exit;
    } else if ($action === 'login') {
        $email = isset($_POST['email']) ? $_POST['email'] : '';
        $password_input = isset($_POST['password']) ? $_POST['password'] : '';
        if ($email === 'admin@aquaruse' && $password_input === '123') {
            echo 'success';
            $conn->close();
            exit;
        }
        $email = $conn->real_escape_string($email);
        $password_input = $conn->real_escape_string($password_input);
        $sql = "SELECT * FROM accounts WHERE email='$email' AND password='$password_input'";
        $result = $conn->query($sql);
        if ($result && $result->num_rows > 0) {
            echo 'success';
        } else {
            echo 'error';
        }
        $conn->close();
        exit;
    } else if ($action === 'update_supply_quantity') {
        $name = isset($_POST['name']) ? $conn->real_escape_string($_POST['name']) : '';
        $quantity = isset($_POST['quantity']) ? intval($_POST['quantity']) : 0;
        if ($name !== '') {
            $sql = "UPDATE supplies SET quantity=$quantity WHERE name='$name'";
            if ($conn->query($sql) === TRUE) {
                echo 'success';
            } else {
                http_response_code(500);
                echo 'error';
            }
        } else {
            http_response_code(400);
            echo 'missing_fields';
        }
        $conn->close();
        exit;
    }
    $conn->close();
    http_response_code(400);
    echo 'invalid_action';
    exit;
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $servername = 'localhost';
    $username = 'root';
    $password = '';
    $dbname = 'aquaruse';
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        http_response_code(500);
        exit('Connection failed');
    }
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    if ($action === 'get_orders') {
        $sql = "SELECT * FROM orders";
        $result = $conn->query($sql);
        $orders = [];
        while($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        header('Content-Type: application/json');
        echo json_encode($orders);
        $conn->close();
        exit;
    }
    if ($action === 'get_customers') {
        $sql = "SELECT * FROM customers";
        $result = $conn->query($sql);
        $customers = [];
        while($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        header('Content-Type: application/json');
        echo json_encode($customers);
        $conn->close();
        exit;
    }
    if ($action === 'get_supplies') {
        $sql = "SELECT name, quantity FROM supplies";
        $result = $conn->query($sql);
        $supplies = [];
        while($row = $result->fetch_assoc()) {
            $supplies[] = $row;
        }
        header('Content-Type: application/json');
        echo json_encode($supplies);
        $conn->close();
        exit;
    }
    $sql = "SELECT id, account_name, email, password FROM accounts";
    $result = $conn->query($sql);
    $accounts = [];
    while($row = $result->fetch_assoc()) {
        $accounts[] = $row;
    }
    header('Content-Type: application/json');
    echo json_encode($accounts);
    $conn->close();
    exit;
} else {
    http_response_code(405);
    exit('Method Not Allowed');
} 