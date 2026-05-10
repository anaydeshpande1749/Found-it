const fs = require("fs");

let content = fs.readFileSync("app/(tabs)/reportlost.tsx", "utf8");
content = content.replace(
  'imageBase64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });',
  'imageBase64 = await FileSystem.readAsStringAsync(image, { encoding: "base64" });'
);
fs.writeFileSync("app/(tabs)/reportlost.tsx", content, "utf8");

content = fs.readFileSync("app/(tabs)/reportfound.tsx", "utf8");
content = content.replace(
  'imageBase64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });',
  'imageBase64 = await FileSystem.readAsStringAsync(image, { encoding: "base64" });'
);
fs.writeFileSync("app/(tabs)/reportfound.tsx", content, "utf8");

console.log("Done!");