<?php

// Configuration
$githubToken = '';  // Replace with your valid GitHub PAT
$repoOwner = 'anthera-art';
$repoName = 'web';
$artifactName = 'app-bundle';
$prodUpdateScript = './prod-update.sh';
$revFilePath = 'frontend/rev.txt';

// Function to make API requests with cURL
function github_api_request($url, $githubToken) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);  // Follow redirects
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token $githubToken",
        "User-Agent: PHP",
        "Accept: application/vnd.github.v3+json"
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        die("GitHub API request failed. URL: $url | HTTP Code: $httpCode\n");
    }

    return json_decode($response, true);
}

// Step 1: Get the latest workflow run
$apiUrl = "https://api.github.com/repos/$repoOwner/$repoName/actions/runs?per_page=1";
$data = github_api_request($apiUrl, $githubToken);
$runId = $data['workflow_runs'][0]['id'] ?? die("Failed to retrieve workflow run.\n");

echo "Latest workflow run ID: $runId\n";

// Step 2: Get the list of artifacts
$artifactsUrl = "https://api.github.com/repos/$repoOwner/$repoName/actions/runs/$runId/artifacts";
$data = github_api_request($artifactsUrl, $githubToken);

$artifactId = null;
foreach ($data['artifacts'] as $artifact) {
    if ($artifact['name'] === $artifactName) {
        $artifactId = $artifact['id'];
        break;
    }
}

if (!$artifactId) {
    die("Artifact '$artifactName' not found.\n");
}

echo "Artifact ID: $artifactId\n";

// Step 3: Get the real artifact download URL
$downloadUrl = "https://api.github.com/repos/$repoOwner/$repoName/actions/artifacts/$artifactId/zip";
$ch = curl_init($downloadUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);  // Do not follow yet
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: token $githubToken",
    "User-Agent: PHP",
    "Accept: application/vnd.github.v3+json"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$redirectUrl = null;

// Extract redirect URL from headers
if ($httpCode === 302) {
    preg_match('/^Location:\s*(.*)$/mi', $response, $matches);
    if (!empty($matches[1])) {
        $redirectUrl = trim($matches[1]);
    }
}

curl_close($ch);

if (!$redirectUrl) {
    die("Failed to get redirect URL for artifact download.\n");
}

echo "Redirect URL found: $redirectUrl\n";

// Step 4: Download the artifact
$zipPath = './artifact.zip';
$ch = curl_init($redirectUrl);
$fp = fopen($zipPath, 'wb');
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);  // Follow final redirect
curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
fclose($fp);

if ($httpCode !== 200) {
    die("Failed to download artifact. HTTP Code: $httpCode\n");
}

echo "Artifact downloaded successfully to $zipPath.\n";

// Step 5: Extract the artifact
$extractPath = './extracted_artifact';
$zip = new ZipArchive;
if ($zip->open($zipPath) === TRUE) {
    $zip->extractTo($extractPath);
    $zip->close();
    echo "Artifact extracted to $extractPath.\n";
} else {
    die("Failed to extract the artifact.\n");
}

// Step 6: Locate app.tar.gz
$artifactPath = "$extractPath/app.tar.gz";
if (!file_exists($artifactPath)) {
    die("app.tar.gz not found inside the extracted artifact.\n");
}

echo "Found app.tar.gz: $artifactPath\n";

// Step 7: Run prod-update.sh
echo "Running prod-update.sh...\n";
$command = escapeshellcmd("$prodUpdateScript $artifactPath");
$output = shell_exec($command);

if ($output === null) {
    die("Failed to run prod-update.sh script.\n");
}

echo "Deployment completed successfully.\n";

// Step 8: Get the latest tag name
$tagsUrl = "https://api.github.com/repos/$repoOwner/$repoName/tags";
$data = github_api_request($tagsUrl, $githubToken);

$latestTagName = $data[0]['name'] ?? die("Failed to retrieve latest tag.\n");

echo "Latest tag name: $latestTagName\n";

// Step 9: Update rev.txt
if (file_put_contents($revFilePath, $latestTagName) !== false) {
    echo "Updated $revFilePath with the latest tag name: $latestTagName\n";
} else {
    die("Failed to update $revFilePath.\n");
}

?>
