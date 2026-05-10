const fs = require("fs");

let content = fs.readFileSync("app/(tabs)/reportlost.tsx", "utf8");
content = content.replace("      mediaTypes: ImagePicker.MediaType.Images,", "");
fs.writeFileSync("app/(tabs)/reportlost.tsx", content, "utf8");

content = fs.readFileSync("app/(tabs)/reportfound.tsx", "utf8");
content = content.replace("      mediaTypes: ImagePicker.MediaType.Images,", "");
fs.writeFileSync("app/(tabs)/reportfound.tsx", content, "utf8");

console.log("Done!");