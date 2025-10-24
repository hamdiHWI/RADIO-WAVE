<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: /admin/index.php');
    exit;
}

require_once __DIR__ . '/../db/config.php';

try {
    $pdo = db();
    // Create table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS stations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        logo_url VARCHAR(255)
    )");

    // Handle form submissions for add/edit/delete
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['add'])) {
            $stmt = $pdo->prepare("INSERT INTO stations (name, url, logo_url) VALUES (?, ?, ?)");
            $stmt->execute([$_POST['name'], $_POST['url'], $_POST['logo_url']]);
        } elseif (isset($_POST['edit'])) {
            $stmt = $pdo->prepare("UPDATE stations SET name = ?, url = ?, logo_url = ? WHERE id = ?");
            $stmt->execute([$_POST['name'], $_POST['url'], $_POST['logo_url'], $_POST['id']]);
        } elseif (isset($_POST['delete'])) {
            $stmt = $pdo->prepare("DELETE FROM stations WHERE id = ?");
            $stmt->execute([$_POST['id']]);
        }
        header("Location: dashboard.php");
        exit;
    }

    // Fetch all stations
    $stations = $pdo->query("SELECT * FROM stations ORDER BY name")->fetchAll();

} catch (PDOException $e) {
    $error = "Database error: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; }
        .container { max-width: 900px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <div class="container mt-5">
        <div class="card">
            <div class="card-header">
                <h3>Manage Radio Stations</h3>
                <a href="/admin/index.php?logout=true" class="btn btn-danger">Logout</a>
            </div>
            <div class="card-body">
                <?php if (isset($error)): ?>
                    <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <!-- Add Station Form -->
                <div class="mb-4">
                    <h4>Add New Station</h4>
                    <form action="dashboard.php" method="POST">
                        <div class="row">
                            <div class="col-md-4">
                                <input type="text" name="name" class="form-control" placeholder="Station Name" required>
                            </div>
                            <div class="col-md-4">
                                <input type="url" name="url" class="form-control" placeholder="Stream URL" required>
                            </div>
                            <div class="col-md-4">
                                <input type="url" name="logo_url" class="form-control" placeholder="Logo URL">
                            </div>
                        </div>
                        <button type="submit" name="add" class="btn btn-primary mt-2">Add Station</button>
                    </form>
                </div>

                <hr>

                <h4>Existing Stations</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Stream URL</th>
                            <th>Logo URL</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($stations)): ?>
                            <tr><td colspan="4" class="text-center">No stations found.</td></tr>
                        <?php else: ?>
                            <?php foreach ($stations as $station): ?>
                                <tr>
                                    <form action="dashboard.php" method="POST">
                                        <input type="hidden" name="id" value="<?= $station['id'] ?>">
                                        <td><input type="text" name="name" class="form-control" value="<?= htmlspecialchars($station['name']) ?>"></td>
                                        <td><input type="text" name="url" class="form-control" value="<?= htmlspecialchars($station['url']) ?>"></td>
                                        <td><input type="text" name="logo_url" class="form-control" value="<?= htmlspecialchars($station['logo_url']) ?>"></td>
                                        <td>
                                            <button type="submit" name="edit" class="btn btn-sm btn-success">Save</button>
                                            <button type="submit" name="delete" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                                        </td>
                                    </form>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>