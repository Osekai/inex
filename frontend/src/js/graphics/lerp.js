// Assuming you have access to a function to calculate the distance between two points
export function distance(point1, point2) {
    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Define the function to perform easing on the lerp value
export function easeInOut(t) {
    return t * t * (3 - 2 * t); // Cubic easing in/out function
}

export function vector2(x, y) {
    return {
        x, y
    }
}

// Define a function to lerp towards a moving point
export function lerpTowards(currentPosition, targetPosition, speed) {
    const lerpedX = currentPosition.x + (targetPosition.x - currentPosition.x) * speed;
    const lerpedY = currentPosition.y + (targetPosition.y - currentPosition.y) * speed;
    return { x: lerpedX, y: lerpedY };
}