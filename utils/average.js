exports.average = (array) => {
    let sum = 0;
    for (let nb of array) {
        sum += nb;
    };
    return (sum/array.length).toFixed(1);
};