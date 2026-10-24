<?php

namespace AWS {

    use Aws;
    use Aws\S3\ObjectUploader;

    class S3
    {
        private static $instance;
        private $client;

        public function __construct()
        {
            $bucket_name = BUCKET_NAME;
            $access_key_id = ACCESS_KEY_ID;
            $access_key_secret = ACCESS_KEY_SECRET;

            $credentials = new Aws\Credentials\Credentials($access_key_id, $access_key_secret);

            $options = [
                'region' => 'auto',
                'endpoint' => BUCKET_ENDPOINT,
                'version' => 'latest',
                'credentials' => $credentials
            ];

            $this->client = new Aws\S3\S3Client($options);
        }

        // $file can be a string or a stream (fopen), use a stream for big files so they don't sit in memory
        public static function uploadFile($file, $path, $contentType = null)
        {
            $options = [];
            if ($contentType != null) {
                $options['params'] = ['ContentType' => $contentType];
            }
            $uploader = new ObjectUploader(
                self::getInstance()->client,
                BUCKET_NAME,
                $path,
                $file,
                'private',
                $options
            );
            $result = $uploader->upload();
            if ($result["@metadata"]["statusCode"] != '200') {
                trigger_error("Could not access S3", E_USER_ERROR);
            }
        }

        public static function getInstance()
        {
            if (self::$instance == null) {
                self::$instance = new S3();
            }
            return self::$instance;
        }

        public static function getFile($path)
        {
            $object = self::getInstance()->client->getObject(array(
                'Bucket' => BUCKET_NAME,
                'Key' => $path
            ));

            return $object;
        }

        public static function renameFolder($sourceFolder, $destinationFolder)
        {
            $sourceFolder = rtrim($sourceFolder, '/') . '/';
            $destinationFolder = rtrim($destinationFolder, '/') . '/';

            $objects = self::getInstance()->client->listObjects([
                'Bucket' => BUCKET_NAME,
                'Prefix' => $sourceFolder,
            ]);

            $deleteKeys = [];

            foreach ($objects['Contents'] as $object) {
                $sourceKey = $object['Key'];
                $destinationKey = str_replace($sourceFolder, $destinationFolder, $sourceKey);

                // copy
                self::getInstance()->client->copyObject([
                    'Bucket' => BUCKET_NAME,
                    'CopySource' => BUCKET_NAME . '/' . $sourceKey,
                    'Key' => $destinationKey,
                ]);

                $deleteKeys[] = ['Key' => $sourceKey];
            }

            // delete all at once in batches of 1000 (S3 limit)
            $chunks = array_chunk($deleteKeys, 1000);
            foreach ($chunks as $chunk) {
                self::getInstance()->client->deleteObjects([
                    'Bucket' => BUCKET_NAME,
                    'Delete' => ['Objects' => $chunk],
                ]);
            }
        }


        public static function copyFile(string $sourcePath, string $destinationPath)
        {
            self::getInstance()->client->copyObject([
                'Bucket' => BUCKET_NAME,
                'CopySource' => BUCKET_NAME . '/' . $sourcePath,
                'Key' => $destinationPath,
            ]);
        }

        public static function deleteFile(string $path)
        {
            self::getInstance()->client->deleteObject([
                'Bucket' => BUCKET_NAME,
                'Key' => $path,
            ]);
        }

        public static function fileExists(string $path): bool
        {
            return self::getInstance()->client->doesObjectExistV2(BUCKET_NAME, $path);
        }

        public static function getUrl(string $path): string
        {
            return S3_URL_PATH . $path;
        }

        public static function deleteFolder(string $old_path)
        {
            $old_path = rtrim($old_path, '/') . '/';

            $objects = self::getInstance()->client->listObjectsV2([
                'Bucket' => BUCKET_NAME,
                'Prefix' => $old_path,
                'MaxKeys' => 11 // request just enough to detect if >10
            ]);

            if (empty($objects['Contents'])) {
                return;
            }

            if (count($objects['Contents']) > 10) {
                trigger_error("Folder has more than 10 items, delete aborted", E_USER_WARNING);
                return;
            }

            foreach ($objects['Contents'] as $object) {
                self::getInstance()->client->deleteObject([
                    'Bucket' => BUCKET_NAME,
                    'Key' => $object['Key'],
                ]);
            }
        }
    }
}
