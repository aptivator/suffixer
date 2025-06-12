module.exports = {
  shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var swapIndex = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[swapIndex];
      arr[swapIndex] = temp;
    }
  }
};
