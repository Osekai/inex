<div class="center">
    <div id="canvas-container"></div>
    <h1>404 <light>not found</light></h1>
    <?php
    if(count($args) > 0) {
        echo $args[0];
    }
    ?>
</div>
<style>
    .center {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        font-size: 30px;
        pointer-events: none;
    }
    .center h1 light {
        font-weight: 200;
    }
    canvas {
        pointer-events: all;
        cursor: pointer;
        position: relative;

        z-index: 9000
    }
</style>