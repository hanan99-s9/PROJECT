<?php
require "db.php";

$userId = (int)($_GET["userId"] ?? 0);
$limit  = (int)($_GET["limit"] ?? 50);

if ($userId<=0) {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"Missing userId"]);
  exit;
}

$stmt = $conn->prepare("SELECT id, full_text, filtered_text, place, created_at
                        FROM messages
                        WHERE user_id=?
                        ORDER BY id DESC
                        LIMIT ?");
$stmt->bind_param("ii", $userId, $limit);
$stmt->execute();
$res = $stmt->get_result();

$items = [];
while ($row = $res->fetch_assoc()) {
  $items[] = [
    "id" => (int)$row["id"],
    "fullText" => $row["full_text"],
    "filteredText" => $row["filtered_text"],
    "place" => $row["place"],
    "createdAt" => $row["created_at"]
  ];
}

echo json_encode(["ok"=>true, "messages"=>$items]);

$stmt->close();
$conn->close();
?>