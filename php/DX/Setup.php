<?php

namespace DX;

class Setup
{
    static function PrintError($title, $message)
    {
        if(isset($_GET['bypassdeverror'])) return;
        ?>
<style>
    * {
        padding: 0px;
        margin: 0px;
        box-sizing: border-box;
    }
    html {
        height: 100%;
    }
    body {
        height: 100%;
        background-color: #04121f;
        color: #eee;
        &:before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                    linear-gradient(#e03a3a 1px, transparent 1px),
                    linear-gradient(90deg, #e03a3a 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: center;
            opacity: 0.32;
            mask-image: radial-gradient(circle at center, #000 10%, transparent 70%);
            pointer-events: none;
        }
        display: flex;
        align-items: center;
        justify-content: center;
        >div {
            width: calc(40px * 19);
            height: calc(40px * 9);
            outline: 1px solid rgba(224, 58, 58, 0.35);
            background: radial-gradient(circle at center, rgba(224,58,58,0.08), rgba(224,58,58,0.02));
            backdrop-filter: blur(4px);
            padding: 28px;
            font-family: monospace;
            display: flex;
            flex-direction: column;
            code {
                background: rgba(224,58,58,0.1);
                color: #ff6b6b;
                padding: 2px 6px;
                border: 1px solid rgba(224,58,58,0.2);
                font-family: monospace;
                font-size: 0.9em;
            }
            .eyebrow {
                font-size: 11px;
                letter-spacing: 0.12em;
                color: #e03a3a;
                text-transform: uppercase;
                margin-bottom: 10px;
                opacity: 0.7;
            }
            h1 {
                font-size: 36px;
                color: #ff6b6b;
                line-height: 1;
                font-weight: 300;
                margin-bottom: 12px;
            }
            .divider {
                width: 100%;
                height: 1px;
                background: linear-gradient(90deg, rgba(224,58,58,0.4), transparent);
                margin-bottom: 16px;
            }
            p {
                font-size: 18px;
                color: #ccb5b5;
                max-width: 90%;
                line-height: 1.4;
                margin-bottom: 24px;
            }
            small {
                display: flex;
                flex-direction: column;
                gap: 20px;
                margin-top: auto;
                border-top: 1px solid rgba(224,58,58,0.15);
                padding-top: 14px;
                color: rgba(224,58,58,0.4);
                display: flex;
                justify-content: space-between;
                a {
                    color: rgba(255,107,107,0.8);
                    font-size: 15px;
                }
            }
        }
    }
    .bypass {
        position: absolute;
        font-family: monospace;
        left: 50%;
        transform: translateX(-50%);
        bottom: 30px;
        a {
            font-size: 15px;
            color: #fff5;
            text-decoration: underline;
        }
    }
</style>
<?php
        if(DEV) {
            echo "<div>";
            echo "<span class='eyebrow'>uh oh</span>";
            echo "<h1>$title</h1>";
            echo "<div class='divider'></div>";
            echo "<p>$message</p>";
            echo "<small>";
            echo "  <a href='/README.md' target='_blank'>Read Documentation</a>";
            echo "  <a href='https://discord.gg/zJY3W5smpU' target='_blank'>Is this on production? Hopefully not, but if it is, let us know here</a>";
            echo "</small>";
            echo "</div>";
            echo "<small class='bypass'><a href='?bypassdeverror'>Bypass this error? This won't fix anything.</a></small>";
            exit;
        } else {
            echo "<div>";
            echo "<span class='eyebrow'>something went wrong</span>";
            echo "<h1>Looks like something broke!</h1>";
            echo "<p>We're probably already on it, but feel free to let us know what went wrong</p>";
            echo "<div class='divider'></div>";
            echo "<span class='eyebrow'>Technical Details</span>";
            echo "<h3>$title</h3>";
            echo "<small style='flex-direction: row;'>";
            echo "  <a href='https://discord.gg/zJY3W5smpU' target='_blank'>Get help on Discord</a>";
            echo "  <a href='https://status.untone.org' target='_blank'>Check service status</a>";
            echo "</small>";
            echo "</div>";
            echo "<small class='bypass' style='opacity: 0.3; font-size: 11px;'>" . $message . "</small>";
            exit;
        }
    }
}