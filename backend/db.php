<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$db   = "silent_app";
$user = "root";
$pass = "";

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["ok"=>false, "error"=>"DB connection failed"]);
  exit;
}
?>
