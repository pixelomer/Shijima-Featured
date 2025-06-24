#!/usr/bin/env -S deno run --allow-env=GITHUB_RUN_NUMBER --allow-read --allow-write=dist

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

await Deno.mkdir("dist", { recursive: true });

let revision = Math.floor(Date.now() / 1000);

if (Deno.env.has("GITHUB_RUN_NUMBER")) {
    const runNumberStr = Deno.env.get("GITHUB_RUN_NUMBER")!;
    const runNumber = parseInt(runNumberStr, 10);
    if (!isNaN(runNumber)) {
        revision = runNumber;
        await Deno.writeTextFile("dist/revision.txt", `${runNumber}`);
    }
}

const indexTemplate = await Deno.readTextFile("static/index.html");
const index = indexTemplate.replaceAll("$$REVISION$$", `${revision}`);
await Deno.writeTextFile("dist/index.html", index);

result.sort((a, b) => (a.name > b.name) ? 1 : -1);

const featuredData = {
    revision: revision,
    version: 1,
    shimeji: result
};

await Deno.writeTextFile("dist/featured.json", JSON.stringify(featuredData));
