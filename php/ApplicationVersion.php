<?php
class ApplicationVersion
{
    const MAJOR = 0;
    const MINOR = 0;
    const PATCH = 1;

    public static function get()
    {
        $commitHash = trim(exec('git log --pretty="%h" -n1 HEAD'));

        $commitDate = new \DateTime(trim(exec('git log -n1 --pretty=%ci HEAD')));
        $commitDate->setTimezone(new \DateTimeZone('UTC'));

        return sprintf('v%s.%s.%s-dev.%s (%s)', self::MAJOR, self::MINOR, self::PATCH, $commitHash, $commitDate->format('Y-m-d H:i:s'));
    }

    public static function hash($branch="main") {
        if ( $hash = file_get_contents( sprintf( '.git/refs/heads/%s', $branch ) ) ) {
            return $hash;
        } else {
            return false;
        }
    }
    public static function revision() {
        $revision = file_get_contents("./frontend/rev.txt");
        return $revision;

    }
}