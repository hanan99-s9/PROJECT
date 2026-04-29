<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$db   = "silent_app";
$user = "root";
$pass = "";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["ok"=>false,"error"=>"DB connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$username  = $data["username"] ?? "";
$password  = $data["password"] ?? "";
$alertName = $data["alertName"] ?? "";

if ($username == "" || $password == "" || $alertName == "") {
    echo json_encode(["ok"=>false,"error"=>"Missing fields"]);
    exit;
}

// تشفير كلمة المرور
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// إضافة المستخدم
$stmt = $conn->prepare("INSERT INTO users (username, password_hash, alert_name) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $passwordHash, $alertName);

if ($stmt->execute()) {
    echo json_encode(["ok"=>true,"message"=>"User registered"]);
} else {
    echo json_encode(["ok"=>false,"error"=>"Username exists"]);
}

$stmt->close();
$conn->close();
?>
