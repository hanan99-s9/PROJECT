<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$userId      = (int)($data["userId"] ?? 0);
$alertName   = trim($data["alertName"] ?? "");
$textSize    = (int)($data["textSize"] ?? 20);
$darkMode    = (int)($data["darkMode"] ?? 0);
$appLanguage = trim($data["appLanguage"] ?? "AR");
$signLanguage= trim($data["signLanguage"] ?? "Arabic");

if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"Missing userId"]);
  exit;
}

$stmt = $conn->prepare("UPDATE users SET alert_name=?, text_size=?, dark_mode=?, app_language=?, sign_language=? WHERE id=?");
$stmt->bind_param("siissi", $alertName, $textSize, $darkMode, $appLanguage, $signLanguage, $userId);

if ($stmt->execute()) {
  echo json_encode(["ok"=>true]);
} else {
  http_response_code(500);
  echo json_encode(["ok"=>false, "error"=>"Update failed"]);
}

$stmt->close();
$conn->close();
?>