<?php

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\Autolink\AutolinkExtension;
use League\CommonMark\Extension\DescriptionList\DescriptionListExtension;
use League\CommonMark\Extension\Footnote\FootnoteExtension;
use League\CommonMark\Extension\Strikethrough\StrikethroughExtension;
use League\CommonMark\Extension\Table\TableExtension;
use League\CommonMark\Extension\TaskList\TaskListExtension;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\MarkdownConverter;

class Markdown
{
    public static function Parse($content)
    {
        if ($content === null) {
            return '';
        }

        // Environment with soft breaks enabled
        $environment = new Environment([
            'html_input' => 'allow',
            'allow_unsafe_links' => true,
            'renderer' => [
                'soft_break' => "<br>\n", // single line breaks render as <br>
            ],
        ]);

        // Core extension (needed for all basic node renderers)
        $environment->addExtension(new CommonMarkCoreExtension());

        // Additional extensions
        $environment->addExtension(new AutolinkExtension());
        $environment->addExtension(new StrikethroughExtension());
        $environment->addExtension(new TableExtension());
        $environment->addExtension(new TaskListExtension());
        $environment->addExtension(new DescriptionListExtension());
        $environment->addExtension(new FootnoteExtension());

        // Converter
        $converter = new MarkdownConverter($environment);

        // Convert and return HTML
        return $converter->convert($content);
    }
}
