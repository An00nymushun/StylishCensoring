

function calcCentroidInRange(data, start, end) {
    const count = end - start;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;

    for (let i = start; i < end; i++) {
        const element = data.get(i);

        rSum += (element & 0xFF);
        gSum += (element >>> 8 & 0xFF);
        bSum += (element >>> 16 & 0xFF);
        aSum += (element >>> 24);
    }

    const centroid = [rSum / count, gSum / count, bSum / count, aSum / count];
    centroid.weight = count;
    return centroid;
}

function getStartingCentroids(data, k) {
    const dataLength = data.length;
    const chunkSize = Math.floor(dataLength / k);
    const centroids = [];
    for (let i = 0; i < k; i++) {
        const chunkStart = i * chunkSize;
        const chunkEnd = (i + 1 === k) ? dataLength : chunkStart + chunkSize;
        centroids.push(calcCentroidInRange(data, chunkStart, chunkEnd));
    }
    return centroids;
}

function compareCentroids(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function stopCondition(oldCentroids, newCentroids, iterations, maxIterations) {
    if (iterations >= maxIterations) return true;

    if(oldCentroids === undefined) return false;

    for (let i = 0; i < newCentroids.length; i++) {
        if (!compareCentroids(newCentroids[i], oldCentroids[i])) {
            return false;
        }
    }

    return true;
}

function distanceSquared(a, b) {
    const rDiff = (a & 0xFF) - (b & 0xFF);
    const gDiff = (a >>> 8 & 0xFF) - (b >>> 8 & 0xFF);
    const bDiff = (a >>> 16 & 0xFF) - (b >>> 16 & 0xFF);
    const aDiff = (a >>> 24) - (b >>> 24);
    return rDiff * rDiff + gDiff * gDiff + bDiff * bDiff + aDiff * aDiff;
}

function expandedDistanceSquared(a, b) {
    const rDiff = a[0] - b[0];
    const gDiff = a[1] - b[1];
    const bDiff = a[2] - b[2];
    const aDiff = a[3] - b[3];
    return rDiff * rDiff + gDiff * gDiff + bDiff * bDiff + aDiff * aDiff;
}

function expandColor(color, array) {
    array[0] = color & 0xFF;
    array[1] = color >>> 8 & 0xFF;
    array[2] = color >>> 16 & 0xFF;
    array[3] = color >>> 24;
}

function compressColor(array) {
    const r = array[0];
    const g = array[1] << 8;
    const b = array[2] << 16;
    const a = array[3] << 24;
    return r | g | b | a;
}

function findClosestCentroidIndex(centroids, expandedColor) {
    let minDistanceCentroidIndex;
    let minDistance = Infinity;
    for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        const distance = expandedDistanceSquared(centroid, expandedColor);
        if(distance < minDistance) {
            minDistance = distance;
            minDistanceCentroidIndex = i;
        }
    }
    return minDistanceCentroidIndex;
}

function addToCentroid(centroid, expandedColor) {
    centroid[0] += expandedColor[0];
    centroid[1] += expandedColor[1];
    centroid[2] += expandedColor[2];
    centroid[3] += expandedColor[3];

    centroid.weight++;
}

function averageCentroids(centroids) {
    for (const centroid of centroids) {
        const weight = centroid.weight;
        centroid[0] /= weight;
        centroid[1] /= weight;
        centroid[2] /= weight;
        centroid[3] /= weight;
    }
}

function createNewCentroids(k) {
    const centroids = new Array(k);
    for (let i = 0; i < k; i++) {
        const newCentroid = [0, 0, 0, 0];
        newCentroid.weight = 0;
        centroids[i] = newCentroid
    }
    return centroids;
}

function getRandomCentroid(data, centroid) {
    expandColor(data.get(Math.floor(Math.random() * data.length)), centroid);
}

function recalculateCentroids(data, oldCentroids) {
    const dataLength = data.length;
    const newCentroids = createNewCentroids(oldCentroids.length);
    const colorBuffer = [0, 0, 0, 0];

    for (const oldCentroid of oldCentroids) {
        if(oldCentroid.weight === 0) {
            getRandomCentroid(data, oldCentroid);
        }
    }

    for (let i = 0; i < dataLength; i++) {
        expandColor(data.get(i), colorBuffer);

        const closestCentroidIndex = findClosestCentroidIndex(oldCentroids, colorBuffer);
        addToCentroid(newCentroids[closestCentroidIndex], colorBuffer);
    }

    averageCentroids(newCentroids);

    return newCentroids;
}

function getCentroidsResult(centroids) {
    return centroids.map(centroid => {
        centroid.color = compressColor(centroid);
        return centroid;
    })
}

function kmeans(data, k, maxIterations = 50) {
    let currentIteration = 0;
    let oldCentroids;
    let centroids = getStartingCentroids(data, k);

    while (!stopCondition(oldCentroids, centroids, currentIteration, maxIterations)) {
        oldCentroids = centroids;
        centroids = recalculateCentroids(data, oldCentroids);
        currentIteration++;
    }

    return getCentroidsResult(centroids);
}