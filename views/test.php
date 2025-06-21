<div class="page-container-inner">
    Welcome to the homepage!
    <?php
    if (Database\Session::LoggedIn()) {
        echo "You are logged in as " . Database\Session::UserData()["Name"] . ".<br>";
    } else {
        echo "You are not logged in! <a href='/login'>Log in</a>";
    }
    ?>

    <?= LOADER ?>

    <div class="progress-loader big-loader" style="--progress: 90;">
        <?= LOADER ?>
    </div>

    <?= LOADER_SMALL ?>

    <div class="panel" style="gap: 10px;">
        <image-gallery-v2></image-gallery-v2>
        <div id="cols"></div>
        <style>
            #cols {
                display: flex;
                flex-wrap: wrap;
            }

            #cols * {
                min-width: 160px;
                min-height: 50px;
                max-width: 160px;
                max-height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                text-shadow: #000 0px 0px 1px,   #000 0px 0px 1px,   #000 0px 0px 1px,
                #000 0px 0px 1px,   #000 0px 0px 1px,   #000 0px 0px 1px;
            }
        </style>
        <script>
            // Function to get all CSS variables from :root
            function getCssVariables() {
                const rootStyles = getComputedStyle(document.getElementById("cols"));
                const cssVariables = [];

                // Iterate over all properties in rootStyles
                for (let i = 0; i < rootStyles.length; i++) {
                    const prop = rootStyles[i];
                    if (prop.startsWith("--")) {  // Check if the property is a CSS variable
                        const value = rootStyles.getPropertyValue(prop).trim();
                        cssVariables.push({name: prop, value: value});
                    }
                }
                return cssVariables;
            }

            // Fill the "cols" div with boxes for each CSS variable
            function createColorBoxes() {
                const cssVariables = getCssVariables();
                const container = document.getElementById("cols");

                cssVariables.forEach(({name, value}) => {
                    const box = document.createElement("div");
                    box.className = "color-box";
                    box.style.background = `var(${name})`;

                    if (!(value.startsWith("rgb") || value.startsWith("#") || value.startsWith("hsl") || value.startsWith("linear") || value.startsWith("url"))) {
                        box.style.background = `hsl(var(${name}))`;
                    }

                    box.innerHTML = `${name}`; // Show variable name and value on hover
                    container.appendChild(box);
                });
            }

            // Run the function
            setTimeout(() => {

                createColorBoxes();
            }, 1000)
        </script>
        <h1>Tag check</h1>
        <handle-check type="user"></handle-check>
        <handle-check preset="tentel" type="character"></handle-check>
        <h1>Quicksearch</h1>
        <quicksearch-bar></quicksearch-bar>
        <h1>Section</h1>
        <div class="divider"></div>
        <h1>Gradient block</h1>
        <canvas id="testcanvas" width="1000" height="200" style="width: 100%; height: 200px"></canvas>
        <p tooltip="hewo :3">hi, i have a tooltip :3</p>
        <h2>Arrow key selection test</h2>
        <input type="text" id="test"></input>
        <div id="test-output"></div>
        <h2>And with custom renderer:</h2>
        <input type="text" id="test-custom"></input>
        <div id="test-output-custom"></div>
        <h2>And with multiselect</h2>
        <input type="text" id="test-ms"></input>
        <div id="test-output-ms"></div>

        <style>
            #test-output .selected, #test-output-custom .selected {
                background-color: #fff;
                color: #000;
            }

            #test-output-ms .selected {
                background-color: #333;
                outline: 1px solid white;
            }

            #test-output-ms .ms-selected {
                background-color: #eee;
                color: #222;
            }
        </style>
        <script>
            import {EasySelector} from "../frontend/src";

            document.addEventListener("DOMContentLoaded", () => {
                var arrowKeyDirector = new EasySelector(
                    document.getElementById("test-output"),
                    document.getElementById("test"),
                    function (item) {
                        console.log(item);
                    }
                )
                arrowKeyDirector.Set([
                    {
                        "name": "item 1"
                    },
                    {
                        "name": "item 2"
                    },
                    {
                        "name": "item 3"
                    },
                    {
                        "name": "item 4"
                    },
                ], "name")

                var arrowKeyDirector2 = new EasySelector(
                    document.getElementById("test-output-custom"),
                    document.getElementById("test-custom"),
                    function (item) {
                        console.log(item);
                    }, function (item, key) {
                        var h1 = document.createElement("h1");
                        h1.innerHTML = "CUSTOM RENDERER " + item[key];
                        return h1;
                    }
                )
                arrowKeyDirector2.Set([
                    {
                        "name": "item 1"
                    },
                    {
                        "name": "item 2"
                    },
                    {
                        "name": "item 3"
                    },
                    {
                        "name": "item 4"
                    },
                ], "name")

                var arrowKeyDirector3 = new EasySelector(
                    document.getElementById("test-output-ms"),
                    document.getElementById("test-ms"),
                    function (item) {
                        console.log(item);
                    }
                )
                arrowKeyDirector3.Set([
                    {
                        "name": "msitem 1"
                    },
                    {
                        "name": "msitem 2"
                    },
                    {
                        "name": "msitem 3"
                    },
                    {
                        "name": "msitem 4"
                    },
                ], "name", true)
            });
        </script>
        <p>Custom Elements:</p>
        <h2>Searchable Dropdown</h2>
        <searchable-dropdown></searchable-dropdown>
        <h2>Tag Input</h2>
        <tag-input></tag-input>
        <h2>Advanced Text Field</h2>
        <advanced-text-field></advanced-text-field>
        <h2>Category Picker</h2>
        <category-picker></category-picker>
        <h2>Gallery</h2>
        <image-gallery></image-gallery>
        <h2>Image Drag Area</h2>
        <image-drag-area></image-drag-area>
        <!-- <h2>Safety Rating Picker</h2>
        <safety-rating-picker></safety-rating-picker>
        <h2>Safety Rating Picker w/ multiple pick</h2>
        <safety-rating-picker multiple></safety-rating-picker>
        <h2>Safety Rating Picker w/ preselected</h2>
        <safety-rating-picker preselect="safe"></safety-rating-picker> -->
        <h2>Safety Rating Picker w/ multiple preselected</h2>
        <safety-rating-picker preselect="safe,explicit" multiple></safety-rating-picker>
        <h2>Safety Rating Picker small w/ preselected</h2>
        <safety-rating-picker preselect="safe" small></safety-rating-picker>
        <h2>Theme Picker</h2>
        <theme-picker></theme-picker>

        <h2>Buttons</h2>
        <a class="button">button</a>
        <a class="button big">big button</a>
        <a class="button small">small button</a>
        <a class="button cta">cta button</a>
        <a class="button cta big">big cta button</a>
        <a class="button cta small"> small cta button</a>

        <h2>Inputs</h2>
        <input type="text" class="input" placeholder="input"></input>
        <input type="text" class="input big" placeholder="input big"></input>
        <input type="text" class="input small" placeholder="input small"></input>

        <h2>Dropdowns</h2>
        <p>Don't do anything yet, I want to make a custom JS object &lt;dropdown&gt; or something.</p>
        <div class="dropdown">Dropdown</div>
        <div class="dropdown big">Dropdown big</div>
        <div class="dropdown small">Dropdown small</div>

        <h2>Checkbox</h2>
        <div class="toggle-text">
            <input type="checkbox" class="checkbox" id="checkbox">
            <label for="checkbox">Test</label>
        </div>

        <h2>Radio buttons</h2>
        <div class="toggle-text">
            <input type="radio" class="radio" name="radio" id="radio1">
            <label for="radio1">Test</label>
        </div>
        <div class="toggle-text">
            <input type="radio" class="radio" name="radio" id="radio2">
            <label for="radio2">Test</label>
        </div>
        <div class="toggle-text">
            <input type="radio" class="radio" name="radio" id="radio3">
            <label for="radio3">Test</label>
        </div>

        <h2>Toggles</h2>
        <div class="toggle-text">
            <input type="checkbox" id="toggle" class="toggle">
            <label for="toggle">Test</label>
        </div>
    </div>
</div>