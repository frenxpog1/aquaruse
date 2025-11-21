<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aquaruse";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully to database '$dbname'";
$conn->close(); 