const firstURL = ["a", "b", "c", "a"];
let newURL;

newURL = firstURL.filter((url, index) => firstURL.indexOf(url) === index);
console.log(newURL);
