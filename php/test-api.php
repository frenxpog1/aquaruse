<?php
// Simple API test script
header('Content-Type: application/json');

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aquaruse";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

echo json_encode(['message' => 'API Test - Connection successful']);

// Test orders query
$sql = "SELECT COUNT(*) as count FROM orders";
$result = $conn->query($sql);
if ($result) {
    $row = $result->fetch_assoc();
    echo json_encode(['orders_count' => $row['count']]);
} else {
    echo json_encode(['error' => 'Orders query failed: ' . $conn->error]);
}

// Test customers query
$sql = "SELECT COUNT(*) as count FROM customers";
$result = $conn->query($sql);
if ($result) {
    $row = $result->fetch_assoc();
    echo json_encode(['customers_count' => $row['count']]);
} else {
    echo json_encode(['error' => 'Customers query failed: ' . $conn->error]);
}

// Test supplies query
$sql = "SELECT name, quantity FROM supplies";
$result = $conn->query($sql);
$supplies = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $supplies[] = $row;
    }
    echo json_encode(['supplies' => $supplies]);
} else {
    echo json_encode(['error' => 'Supplies query failed: ' . $conn->error]);
}

$conn->close();
?>