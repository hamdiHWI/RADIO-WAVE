<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db/config.php';

try {
    $pdo = db();
    $stations = $pdo->query("SELECT id, name, url, logo_url FROM stations ORDER BY name")->fetchAll();
    echo json_encode($stations);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
