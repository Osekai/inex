import {hexToHSL} from "../utils/colour";
import {lerpTowards, vector2} from "./lerp";

class GradientBlock {
    putCross(ctx, p) {
        for (const [i, point] of p.entries()) {
            ctx.beginPath();
            ctx.moveTo(point.x - 5, point.y - 5);
            ctx.lineTo(point.x + 5, point.y + 5);
            ctx.moveTo(point.x - 5, point.y + 5);
            ctx.lineTo(point.x + 5, point.y - 5);
            ctx.stroke();
            ctx.fillText(i, point.x + 7, point.y + 7);
        }
    }

    getProjectionDistance(a, b, c) {
        const k2 = b.x * b.x - b.x * a.x + b.y * b.y - b.y * a.y;
        const k1 = a.x * a.x - b.x * a.x + a.y * a.y - b.y * a.y;
        const ab2 = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
        const kcom = (c.x * (a.x - b.x) + c.y * (a.y - b.y));
        const d1 = (k1 - kcom) / ab2;
        const d2 = (k2 + kcom) / ab2;
        return {
            d1,
            d2
        };
    }

    limit01(value) {
        if (value < 0) {
            return 0;
        }
        if (value > 1) {
            return 1;
        }
        return value;
    }

    paddingleft0(v, v_length) {
        while (v.length < v_length) {
            v = '0' + v;
        }
        return v;
    }

    getWeightedColorMix(points, ratios) {
        let r = 0;
        let g = 0;
        let b = 0;
        for (const [ind, point] of points.entries()) {
            r += Math.round(parseInt(point.c.substring(1, 3), 16) * ratios[ind]);
            g += Math.round(parseInt(point.c.substring(3, 5), 16) * ratios[ind]);
            b += Math.round(parseInt(point.c.substring(5, 7), 16) * ratios[ind]);
        }

        let result = '#' + this.paddingleft0(r.toString(16), 2) + this.paddingleft0(g.toString(16), 2) + this.paddingleft0(b.toString(16), 2);

        return result;
    }

    /**
     * Given some points with color attached, calculate the color for a new point
     * @param  p The new point position {x: number, y: number}
     * @param  points The array of given colored points [{x: nember, y: number, c: hexColor}]
     * @return hex color string -- The weighted color mix
     */
    getGeometricColorMix(p, points) {
        let colorRatios = new Array(points.length);
        colorRatios.fill(1);
        for (const [ind1, point1] of points.entries()) {
            for (const [ind2, point2] of points.entries()) {
                if (ind1 != ind2) {
                    var d = this.getProjectionDistance(point1, point2, p);
                    colorRatios[ind1] *= this.limit01(d.d2);
                }
            }

        }
        let totalRatiosSum = 0;
        colorRatios.forEach(c => totalRatiosSum += c);
        colorRatios.forEach((c, i) => colorRatios[i] /= totalRatiosSum);
        var c = this.getWeightedColorMix(points, colorRatios);
        return c;
    }

    points = []; // these are the starting points for drawing the gradient


    // base points be like:
    // [{ x: "50%", y: "50%", c: "#ff66aa" }, ...]
    // and what we want:

    constructor(canv, base_points_x) {
        var base_points = JSON.parse(JSON.stringify(base_points_x)); // ? i love javascript

        base_points.forEach(point => {
            if (!point.c.includes("#")) point.c = "#" + point.c
            point.x = parseFloat(point.x) * canv.width / 100;
            point.y = parseFloat(point.y) * canv.height / 100; // Using canvas width for y as well
            point.c = point.c.toUpperCase();
        });
        this.points = base_points;

        var ctx = canv.getContext("2d");
        //this.putCross(ctx, this.points); // optional, only to show the original point position
        ctx.globalCompositeOperation = 'destination-over'; // to show the cross points over the gradient
        let xcs = this.points.map(p => p.x);
        let ycs = this.points.map(p => p.y);
        let xmin = Math.min(...xcs);
        let xmax = Math.max(...xcs);
        let ymin = Math.min(...ycs);
        let ymax = Math.max(...ycs);
        let x, y;
        let mixColor;

        // iterate all the pixels between the given points
        for (x = xmin; x < xmax; x++) {
            for (y = ymin; y < ymax; y++) {
                mixColor = this.getGeometricColorMix({
                    x: x,
                    y: y
                }, this.points);
                ctx.fillStyle = mixColor;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

}

window.GradientBlock = GradientBlock;
class GradientBlockAnimated {
    ctx;
    points;
    canvas;

    constructor(canvas, p) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.points = p;

        for (let point of this.points) {
            point.x = parseInt(point.x.replace("%", ""));
            point.y = parseInt(point.y.replace("%", ""));
            point.colour = hexToHSL(point.c);
            point.velocity = { x: 0, y: 0 }; // Initialize velocity
            point.endpoint = [Math.random() * 100, Math.random() * 100];
            point.easing = 0.01; // Easing factor for velocity
        }

        console.log(this.points);

        setInterval(() => {
            for (let point of this.points) {
                // Update endpoint using easing function
                point.endpoint = [
                    Math.min(Math.random() * 100, 100),
                    Math.min(Math.random() * 100, 100)
                ];

            }
        }, 2500)

        this.draw();
    }


    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const sigma = 220.6; // Sigma parameter for Gaussian distribution

        console.log(this.canvas.width )
        console.log(this.canvas.height)

        for (let point of this.points) {

            // Calculate distance to endpoint
            const dx = point.endpoint[0] - point.x;
            const dy = point.endpoint[1] - point.y;

            // Update velocity using easing function
            point.velocity = {
                x: lerp(point.velocity.x, dx * point.easing, 0.0004),
                y: lerp(point.velocity.y, dy * point.easing, 0.0004)
            };

            // Update position based on velocity
            point.x += point.velocity.x;
            point.y += point.velocity.y;


            const x = (this.canvas.width / 100) * point.x;
            const y = (this.canvas.height / 100) * point.y;

            console.log([point.x, point.y]);


            var x_distance = 50 - point.x;
            var y_distance = 50 - point.y;

            const gradient = this.ctx.createRadialGradient(x, y, 0, x + (x_distance), y + (y_distance), 100);

            const stops = 50;

            var stopsl = [];

            for (let i = 0; i <= stops; i++) {
                const position = i / stops;
                const distance = position * 90; // Max distance is the outer radius
                let opacity = Math.exp(-Math.pow(distance, 2) / (2 * Math.pow(sigma, 1.9)));
                opacity = opacity * (1 - position);

                const color = `hsla(${point.colour[0]}, ${point.colour[1]}%, ${point.colour[2]}%, ${opacity})`;
                gradient.addColorStop(position, color);
            }

            console.log(stopsl);

            this.ctx.fillStyle = gradient;

            const rectWidth = 660;
            const rectHeight = 660;
            this.ctx.fillRect(x - (rectWidth / 2), y - (rectHeight / 2), rectWidth, rectHeight);
        }

        const self = this;


        window.requestAnimationFrame(function () {
            self.draw();
        });
    }
}

// Linear interpolation function
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Modified linear interpolation function with maximum speed and distance threshold
function smoothMove(current, target, maxSpeed) {
    const maxDistance = maxSpeed;
    const distance = target - current;
    const sign = Math.sign(distance);
    const speed = Math.min(Math.abs(distance), maxSpeed);
    return current + sign * speed;
}


export {GradientBlock, GradientBlockAnimated};