#!/usr/bin/env -S deno run --allow-read

import * as YAML from "jsr:@std/yaml";

let success = true;

const matchSet = new Set<string>();

const noExt = (name: string) => {
    const comps = name.split(".");
    comps.splice(comps.length-1);
    return comps.join(".");
}

const fail = (...args: unknown[]) => {
    success = false;
    console.error("ERROR:", ...args);
}

for await (const file of Deno.readDir("shimeji")) {
    if (!file.isFile) {
        fail(`Non-file entry: ${file.name}`);
    }
    if (file.name.startsWith(".")) {
        fail(`Hidden file: ${file.name}`);
    }
    if (!file.name.endsWith(".png") && !file.name.endsWith(".yaml")) {
        fail(`Unexpected file type: ${file.name}`);
    }
    else {
        const basename = noExt(file.name);
        if (matchSet.has(basename)) {
            matchSet.delete(basename);
        }
        else {
            matchSet.add(basename);
        }
    }
    if (file.name.endsWith(".yaml")) {
        const data = await Deno.readTextFile(`shimeji/${file.name}`);
        const lines = data.split("\n");
        for (let i=0; i<lines.length; ++i) {
            if (!lines[i].includes("http") && lines[i].length > 80) {
                fail(`80-column limit exceeded: ${file.name}, line ${i+1}`);
            }
        }
        if (!data.endsWith("\n")) {
            fail(`No newline at the end of yaml: ${file.name}`);
        }
        else if (data.trim().length !== data.length-1) {
            fail(`Excessive leading/trailing whitespace: ${file.name}`);
        }
        try {
            YAML.parse(data);
        }
        catch (err: unknown) {
            fail(`YAML file is invalid: ${file.name}`);
            console.log(`${err}`);
        }
    }
}

if (matchSet.size != 0) {
    fail(`Unmatched png/yaml pairs: ${[...matchSet].join(", ")}`);
}

if (success) {
    console.error("The data appears to be in the correct format.");
}
else {
    console.error("Linting failed due to one or more errors.");
}

Deno.exit(success ? 0 : 1);