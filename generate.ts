#!/usr/bin/env -S deno run --allow-read --allow-write=dist --allow-write=dist/featured.json

import * as YAML from "jsr:@std/yaml";
import { encodeBase64 } from "jsr:@std/encoding/base64";

interface ShimejiYaml {
    shimeji: {
        name: string,
        url: string,
        creator: string,
        description: string[]
    }
}

interface ShimejiJson {
    name: string,
    url: string,
    creator: string,
    description: string,
    preview: string
}

const result: ShimejiJson[] = [];

for await (const file of Deno.readDir("shimeji")) {
    if (!file.isFile || !file.name.endsWith(".yaml")) {
        continue;
    }
    const shimeji = (YAML.parse(await Deno.readTextFile(`shimeji/${file.name}`)
        ) as ShimejiYaml).shimeji;
    const imageData = await Deno.readFile(`shimeji/` +
        `${file.name.substring(0, file.name.length-5)}.png`);
    const json: ShimejiJson = {
        name: shimeji.name,
        url: shimeji.url,
        creator: shimeji.creator,
        description: shimeji.description.join("\n\n"),
        preview: encodeBase64(imageData)
    };
    result.push(json);
}

const featuredData = {
    version: 1,
    shimeji: result
};

await Deno.mkdir("dist", { recursive: true });
await Deno.writeTextFile("dist/featured.json", JSON.stringify(featuredData));
