<?php
// Simple database connection test
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aquaruse";

// Test connection
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'error' => 'Connection failed: ' . $conn->connect_error,
        'message' => 'Please check your database credentials and make sure MySQL is running'
    ]);
    exit();
}

// Test if database exists
$db_check = $conn->query("SELECT DATABASE()");
if (!$db_check) {
    echo json_encode([
        'success' => false,
        'error' => 'Database not found',
        'message' => 'Please run database_setup.sql to create the database'
    ]);
    exit();
}

// Test if tables exist
$tables = ['orders', 'customers', 'staff', 'supplies'];
$missing_tables = [];

foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows == 0) {
        $missing_tables[] = $table;
    }
}

if (count($missing_tables) > 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Missing tables: ' . implode(', ', $missing_tables),
        'message' => 'Please run database_setup.sql to create the tables'
    ]);
    exit();
}

// Count records in each table
$counts = [];
foreach ($tables as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    $row = $result->fetch_assoc();
    $counts[$table] = $row['count'];
}

echo json_encode([
    'success' => true,
    'message' => 'Database connection successful!',
    'database' => $dbname,
    'tables' => $counts,
    'server_info' => $conn->server_info
]);

$conn->close();
?>
