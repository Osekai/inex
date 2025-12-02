<?php

class Discord
{
    static function postDiscordEmbeds(string $webhookUrl, array $embeds, string $content = ''): bool
    {
        // Ensure embeds do not exceed Discord's limit of 10
        if (count($embeds) > 10) {
            throw new InvalidArgumentException('Discord allows a maximum of 10 embeds per message.');
        }

        // Prepare the payload
        $payload = [
            'content' => $content,
            'embeds' => $embeds
        ];

        // Encode the payload as JSON
        $jsonPayload = json_encode($payload);

        // Initialize cURL
        $ch = curl_init();

        // Set cURL options
        curl_setopt($ch, CURLOPT_URL, $webhookUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        // Execute the request
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        // Close cURL
        curl_close($ch);

        // Check if the response indicates success
        return $httpCode >= 200 && $httpCode < 300;
    }
}