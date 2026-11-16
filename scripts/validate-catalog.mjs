import {readFileSync} from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
const toolkits=read("registry/toolkits.json");
const devices=read("registry/android-devices.json");
const toolkitSchema=read("schemas/toolkits.schema.json");
const deviceSchema=read("schemas/android-devices.schema.json");
for(const [name,data,schema] of [
 ["toolkit catalog",toolkits,toolkitSchema],["Android device catalog",devices,deviceSchema]
]){
 const validate=ajv.compile(schema);
 if(!validate(data))throw new Error(name+" schema validation failed:\n"+ajv.errorsText(validate.errors,{separator:"\n"}));
}
const esp=toolkits.find(t=>t.id==="esp-idf");
const android=toolkits.find(t=>t.id==="android-sdk");
if(!esp?.versions?.some(v=>v.version==="5.5.6")||!esp.versions.some(v=>v.version==="6.1.1"))
 throw new Error("ESP-IDF 5.5.6 and 6.1.1 must both be published");
const androidVersion=android?.versions?.find(v=>v.version==="2026.2.2-patch1");
if(!androidVersion)throw new Error("Current Android SDK profile is missing");
const legacy=androidVersion.deviceSupport?.targetProfiles?.find(p=>p.id==="android-legacy-api22-eink");
if(legacy?.apiLevel!==22||legacy?.nativeAbi!=="armeabi-v7a")throw new Error("Android 5.1.1 E Ink target profile is invalid");
for(const toolkit of toolkits)for(const version of toolkit.versions||[]){
 for(const installer of version.installers||[]){
  if(!/^[a-f0-9]{64}$/i.test(installer.sha256))throw new Error("Invalid installer checksum: "+toolkit.id+"@"+version.version);
  if(!installer.source?.startsWith("https://"))throw new Error("Installer source must use HTTPS: "+toolkit.id+"@"+version.version);
 }
}
console.log("Marketplace toolkit and Android device catalogs validated.");
