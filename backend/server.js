    //dependencies
    import Koa from 'koa';
    import json from 'koa-json';
    import bodyParser from 'koa-bodyparser';
    import session from 'koa-session';
    import {dirname, join} from 'path';
    import { fileURLToPath } from 'url';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    import dotenv from 'dotenv';
    import render from '@koa/ejs'; //per il frontend usando EJS
    import { errorMiddleware } from './errors.js';
    import router from './router.js';
    //Koa app
    const app = new Koa();
    //Port import from .env
    dotenv.config();
    const PORT = process.env.PORT || 3000;

    render(app, {
        root: join(__dirname, '..', 'frontend', 'views'),
        layout: 'layout',
        viewExt: 'html',
        cache: false,
        debug: false
    });

    //configurazione di sessione
    app.keys = [process.env.COOKIE_SIGN]; // Chiave segreta per firmare i cookie delle sessioni
    const CONFIG = {
        key: 'koa.sess', // Nome del cookie della sessione
        maxAge: 3600000, // Durata della sessione (1 ora)
        httpOnly: true, // Il cookie è accessibile solo tramite HTTP (non JavaScript)
        signed: true, // Firma il cookie per prevenire manipolazioni
        secure: false, // Imposta su true in produzione se usi HTTPS
    };
    app.use(session(CONFIG, app));

    // id dell applicazione registrati nella dashboard
    // di Spotify for Developers, essenziali per usare le API
    app.client_id = process.env.CLIENT_ID;  
    app.client_secret = process.env.CLIENT_SECRET;
    app.callback_uri = `http://localhost:${PORT}/callback`;
    app.use(errorMiddleware);

    // middlewares essenziali
    app.use(json());
    app.use(bodyParser());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.listen(PORT, ()=>{
        console.log(`http://localhost:${PORT}`);
    })