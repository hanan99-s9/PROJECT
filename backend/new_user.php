<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username  = trim($data["username"] ?? "");
$password  = trim($data["password"] ?? "");
$alertName = trim($data["alertName"] ?? "");

if ($username==="" || $password==="" || $alertName==="") {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"Missing fields"]);
  exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (username, password_hash, alert_name) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $passwordHash, $alertName);

if ($stmt->execute()) {
  echo json_encode(["ok"=>true, "userId"=>$conn->insert_id]);
} else {
  http_response_code(409);
  echo json_encode(["ok"=>false, "error"=>"Username already exists"]);
}

$stmt->close();
$conn->close();
?>
