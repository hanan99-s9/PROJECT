<?php
require "auth.php";

$data = json_decode(file_get_contents("php://input"), true);

$userId = (int)($data["userId"] ?? 0);
$full   = trim($data["fullText"] ?? "");
$filtered = trim($data["filteredText"] ?? "");
$place  = trim($data["place"] ?? "");

if ($userId<=0 || $full==="") {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"Missing fields"]);
  exit;
}

$stmt = $conn->prepare("INSERT INTO messages (user_id, full_text, filtered_text, place) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isss", $userId, $full, $filtered, $place);

if ($stmt->execute()) {
  echo json_encode(["ok"=>true, "messageId"=>$conn->insert_id]);
} else {
  http_response_code(500);
  echo json_encode(["ok"=>false, "error"=>"Insert failed"]);
}

$stmt->close();
$conn->close();
?>
