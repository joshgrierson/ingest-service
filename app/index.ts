import fs from "fs";
import path from "path";
import { Server } from "http";
import Bluebird from "bluebird";

require("dotenv").config({
    path: path.resolve(`${process.cwd()}/.env/.env-${process.env.NODE_ENV}`)
});

const http: Server = Bluebird.promisifyAll(require("http"));

const RSA_PRIVATE_KEY_PATH: string = ".rsa/key";
const RSA_PUBLIC_KEY_PATH: string = ".rsa/key.pub";

async function testRSAKeys(): Promise<boolean> {
    if (!fs.existsSync(RSA_PRIVATE_KEY_PATH) || !fs.existsSync(RSA_PUBLIC_KEY_PATH)) {
        throw new Error(`RSA key pair not found at path '${RSA_PRIVATE_KEY_PATH}, ${RSA_PUBLIC_KEY_PATH}'`);
    }

    return Promise.resolve(true);
}

console.log(process.env.REDIS_HOST);