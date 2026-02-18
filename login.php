<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$password = trim($data["password"] ?? "");

if ($username==="" || $password==="") {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"Missing fields"]);
  exit;
}

$stmt = $conn->prepare("SELECT * FROM users WHERE username=? LIMIT 1");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();

if (!$user || !password_verify($password, $user["password_hash"])) {
  http_response_code(401);
  echo json_encode(["ok"=>false, "error"=>"Invalid credentials"]);
  exit;
}

$token = bin2hex(random_bytes(32));

$update = $conn->prepare("UPDATE users SET api_token=? WHERE id=?");
$update->bind_param("si", $token, $user["id"]);
$update->execute();
$update->close();

echo json_encode([
    "ok"=>true,
    "token"=>$token,
    "user"=>[
        "id"=>$user["id"],
        "username"=>$user["username"],
        "alertName"=>$user["alert_name"],
        "textSize"=>$user["text_size"],
        "darkMode"=>$user["dark_mode"],
        "appLanguage"=>$user["app_language"],
        "signLanguage"=>$user["sign_language"]
    ]
]);

$stmt->close();
$conn->close();
?>