import Router from '@koa/router';
import { generateRandomString, getData, computeAlbums, tracksFilter} from './controllers.js'
import { HttpError } from "./errors.js";
//main Router
const router = new Router();//routing

router.get('/', async (ctx)=>{
    if (ctx.session.logged)
        return ctx.redirect('/dashboard');
    await ctx.render('index');
})

// route di accesso al profilo Spotify
// l'utente viene rediretto ad una pagina di accesso per Spotify
// ed in seguito gli verrà chiesto di accettare o meno le autorizzazioni

router.get('/authorize', async (ctx, next)=>{
    if (ctx.session.logged){
        ctx.redirect('/dashboard');
    } else {

    let stateAuth = await generateRandomString();//protezione da cross-site request forgery

    ctx.session.spotify_state = stateAuth;

    const auth_qparams = new URLSearchParams({
        client_id: ctx.app.client_id, //id applicazione relativo alla dashboard di SFD
        response_type: 'code',
        scope: 'user-library-read user-top-read', // necessario per accedere ai dati sulle tracce salvate, playlist ecc
        redirect_uri: ctx.app.callback_uri, // forniamo la rotta di redirezione una volta ottenuto il code
        state: stateAuth,
        show_dialog: true,
    });
    ctx.redirect(`https://accounts.spotify.com/authorize?${auth_qparams.toString()}`);
    }
})

// redirezione da Spotify al nostro server
router.get('/callback', async (ctx, next)=>{
    const receivedState = ctx.query.state;
    if (receivedState !== ctx.session.spotify_state)
        throw new HttpError('Invalid state', 'Il parametro state non è valido', 400);
    
    //estrapoliamo il codice di autorizzazione fornito da Spotify
    const code = ctx.query.code;
    // costruiamo la nuova richiesta HTTP per generare il token
    const body = new URLSearchParams({
        code: code,
        redirect_uri: ctx.app.callback_uri,
        grant_type: "authorization_code",
    });

    // fetch all'API di generazione del token: si usa ora HTTP Basic
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "post",
        body: body,
        headers: {
            "Content-type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                Buffer.from(ctx.app.client_id + ":" + ctx.app.client_secret).toString("base64"),
        },
    });
    // otteniamo finalmente il token
    const data = await response.json();
    if (data.error) {
        throw new HttpError("Spotify Authentication Error", data.error_description || "Unknown error", 500);
    }
    ctx.session.access_token = data.access_token;
    ctx.session.logged=true;
    ctx.redirect("/dashboard");
});
//Dashboard vera e propria una volta completato l'accesso
router.get('/dashboard', async (ctx, next)=>{
    if (!ctx.session.logged) {
        throw new HttpError("Unauthorized", "L'utente non è autenticato", 401);
    }
    if (!ctx.session.display_name || !ctx.session.imageUrl){
        const userInfo = await getData(ctx, "/me");
        ctx.session.display_name = userInfo.display_name;
        ctx.session.imageUrl = userInfo.images[0].url;
    }
    await ctx.render('dashboard', {info: ctx.session});
});

router.get('/top/:range?', async(ctx, next)=>{
    if (!ctx.session.logged) {
        throw new HttpError("Unauthorized", "L'utente non è autenticato", 401);
    }
    let range = ctx.params.range || 'short_term';
    const toptracks = await getData(ctx, `/me/top/tracks?time_range=${range}&limit=50`);

    await ctx.render('top', {info: ctx.session, items: toptracks.items, range: range});
})

router.get('/top/:range/:param/:id', async(ctx, next)=>{
    if (!ctx.session.logged) {
        throw new HttpError("Unauthorized", "L'utente non è autenticato", 401);
    }
    let range = ctx.params.range;
    let param = ctx.params.param;
    let id = ctx.params.id;
    var result = [];
    var offset = 0;

    async function fetchTracks() {
        if (result.length >= 50 || offset >= 500) return;  // Condizione di uscita

        const toptracks = await getData(ctx, `/me/top/tracks?time_range=${range}&limit=50&offset=${offset}`);
        const filteredTracks = await tracksFilter(toptracks, param, id);
        result = result.concat(filteredTracks);
        offset += 50;
        
        await fetchTracks();  // Ricorsione per ottenere più dati se necessario
    }

    await fetchTracks();
    
    await ctx.render('top', {info: ctx.session, items: result, range: range});
})

router.get('/topartists/:range?', async(ctx, next)=>{
    if (!ctx.session.logged) {
        throw new HttpError("Unauthorized", "L'utente non è autenticato", 401);
    }
    let range = ctx.params.range || 'short_term';
    const topartists = await getData(ctx, `/me/top/artists?time_range=${range}&limit=50`);
    await ctx.render('topartists', {info: ctx.session, items: topartists.items});
})

router.get('/topalbums/:range?', async(ctx, next)=>{
    if (!ctx.session.logged) {
        throw new HttpError("Unauthorized", "L'utente non è autenticato", 401);
    }
    let range = ctx.params.range || 'short_term';
    const toptracks = await getData(ctx, `/me/top/tracks?time_range=${range}&limit=50`);
    const topalbums = await computeAlbums(toptracks.items);

    await ctx.render('topalbums', {info: ctx.session, items: topalbums});
})

router.get('/createplaylist/', async(ctx, next)=>{
})

// Logout
router.get('/logout', async (ctx, next)=>{
    if (ctx.session.logged) {
        ctx.session = null;
        ctx.redirect('/');
    } else {
        throw new HttpError('Bad Request', 'Non sei autenticato', 400);
    }
})

//Catch-all route
router.get('/(.*)', async(ctx)=>{
    throw new HttpError("Not Found", "Risorsa non trovata", 404);
});

export default router;