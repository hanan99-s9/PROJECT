<?php
require "db.php";

$headers = getallheaders();
$token = $headers["X-API-TOKEN"] ?? "";

if ($token === "") {
    http_response_code(401);
    echo json_encode(["ok"=>false,"error"=>"Missing token"]);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM users WHERE api_token=? LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    http_response_code(401);
    echo json_encode(["ok"=>false,"error"=>"Invalid token"]);
    exit;
}

$AUTH_USER_ID = $user["id"];
$stmt->close();