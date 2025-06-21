<?php
$medals = \Data\Medals::GetAll();
?>
<script>
    const medals_preload = <?= json_encode($medals) ?>;
</script>
<div id="medals-container"></div>

<script>
    const container = document.getElementById('medals-container');

    for(var medal of medals_preload['content']) {
        console.log(medal);
        const medalDiv = document.createElement('div');
        medalDiv.className = 'medal';

        // Add images
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'images';

        const slug = medal.Link.replace(".png", "");
        const imagePaths = [
            `/assets/osu/web/${slug}.png`,
            `/assets/osu/web/${slug}@2x.png`,
            `/assets/osu/client/${slug}.png`,
            //`/assets/osu/client/${slug}@2x.png`
        ];
        const imageNames = [
            'web',
            'web2x',
            'client',
            'client2x'
        ]
        const expected = [
            '110x118',
            '222x238',
            '193x210'
        ]
        let x = 0;

        imagePaths.forEach(path => {
            const imgDiv = document.createElement("div");
            const imgCont = document.createElement("div");
            imgCont.classList.add("imgcont");
            imgDiv.appendChild(imgCont);

            const img = document.createElement('img');
            img.src = path;
            img.alt = slug;

            imgCont.classList.add(imageNames[x]);
            let index = x;
            // Add resolution display onload
            img.onload = () => {
                const resolution = `${img.naturalWidth}x${img.naturalHeight}`;
                const resolutionDiv = document.createElement('div');

                const [expectedWidth, expectedHeight] = expected[index].split('x').map(Number);
                const actualWidth = img.naturalWidth;
                const actualHeight = img.naturalHeight;

                if (resolution !== expected[index]) {
                    console.log(resolution, expected[index]);
                    resolutionDiv.style.color = "red";
                    resolutionDiv.classList.add("bad");

                    const widthDiff = actualWidth - expectedWidth;
                    const heightDiff = actualHeight - expectedHeight;

                    resolutionDiv.innerHTML = `${imageNames[index]}<br>${resolution} <br>(${widthDiff > 0 ? '+' : ''}${widthDiff}, ${heightDiff > 0 ? '+' : ''}${heightDiff})`;
                } else {
                    resolutionDiv.innerHTML = `${imageNames[index]}<br>${resolution}`;
                }

                imgDiv.prepend(resolutionDiv);
            };


            imgCont.appendChild(img);
            imagesDiv.appendChild(imgDiv);
            x++;

        });

        // Add name and year
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info';
        const year = new Date(medal.Date_Released).getFullYear();
        infoDiv.textContent = `${medal.Name} (${year})`;

        // Append to medalDiv
        medalDiv.appendChild(infoDiv);
        medalDiv.appendChild(imagesDiv);

        // Append to container
        container.appendChild(medalDiv);
    }
</script>
<style>

    #medals-container {
        display: flex;
        flex-wrap: wrap;
        }
    .medal {
        margin: 10px;
        border-radius: 4px;
        background: var(--col-l3);
        border-top: 8px solid var(--col-l4);
    }
    .medal .images {
        display: flex;

    }
    .medal .info {
        font-size: 20px;
        margin: 8px;
        margin-bottom: 0px;
        margin-top: 20px;
        font-weight: 900;
    }
    .medal:has(*.bad) {
        border-top: 8px solid red;
    }
    .medal .images > div {
        margin: 8px;
        font-size: 20px;
        font-family: monospace;
    }
    .medal .images img {
        background: var(--col-l90);
        color: red;
    }
    .medal .images .imgcont {
        background: #f00;
    }
    .medal .images .imgcont.web {
        width: 110px;
        height: 118px;
    }
    .medal .images .imgcont.web2x {
        width: 222px;
        height: 238px;
    }
    .medal .images .imgcont.client {
        width: 193px;
        height: 210px;
    }
    .medal .images .imgcont.client2x {
        width: 385px;
        height: 420px;
    }
</style>