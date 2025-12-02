<?php

namespace AWS {

    use Aws;
    use Aws\S3\ObjectUploader;
    use Encryption;

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

        public static function uploadFile($file, $path)
        {
            if (USE_IMG_ENCRYPTION) {
                $file = Encryption::EncryptString($file, IMG_ENCRYPTION_KEY);
            }
            $uploader = new ObjectUploader(
                self::getInstance()->client,
                BUCKET_NAME,
                $path,
                $file
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

            foreach ($objects['Contents'] as $object) {
                $sourceKey = $object['Key'];

                $destinationKey = str_replace($sourceFolder, $destinationFolder, $sourceKey);

                self::getInstance()->client->copyObject([
                    'Bucket' => BUCKET_NAME,
                    'CopySource' => BUCKET_NAME . '/' . $sourceKey,
                    'Key' => $destinationKey,
                ]);

                self::getInstance()->client->deleteObject([
                    'Bucket' => BUCKET_NAME,
                    'Key' => $sourceKey,
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
    }
}
