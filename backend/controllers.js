import crypto from 'crypto';
import { Piscina } from 'piscina';
import { resolve } from 'path';


const workerPool1 = new Piscina({
    filename: resolve('./worker1.js'),
    maxThreads: 4
});

const workerPool2 = new Piscina({
    filename: resolve('./worker2.js'),
    maxThreads: 4
});
// generazione di stringa casuale per la protezione da CSRF
export async function generateRandomString(){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randoms = crypto.randomBytes(16);
    let res = '';
    randoms.forEach( (b) => {
        res += chars[b % chars.length];
    })
    return res;
};

export async function computeAlbums(data) {
    return workerPool1.run(data);
}
              
export async function getData(ctx, endpoint) {
    const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
        Authorization: "Bearer " + ctx.session.access_token,
    },
    });
    const data = await response.json();
    return data;
};

export function tracksFilter(tracce, tipo, valore) {
    return workerPool2.run([tracce, tipo, valore]);
};
