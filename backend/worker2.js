function runWorker2([tracce, tipo, valore]){
    // Filtra le tracce in base al tipo (artista o album)
    return tracce.items.filter(traccia => {
        if (tipo === 'artist') {
            // Filtra per artista: verifica se uno degli artisti contiene il valore
            return traccia.artists.some(artista => artista.name.toLowerCase().includes(valore.toLowerCase()));
        } else if (tipo === 'album') {
            // Filtra per album: verifica se il nome dell'album contiene il valore
            return traccia.album.name.toLowerCase().includes(valore.toLowerCase());
        } else {
            console.warn("Tipo non valido:", tipo);
            return false;
        }
    });
}

export default function ([tracce, tipo, valore]) {
    return runWorker2([tracce, tipo, valore]);
}