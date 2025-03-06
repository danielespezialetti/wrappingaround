function runWorker1(tracks){
    const albums = tracks.reduce((acc, track) => {
        const { id, name, artists, release_date, images } = track.album;
        if (!acc[id]) {
            acc[id] = {
                count: 0,
                url: images?.[2]?.url || images?.[0]?.url,
                name,
                artists,
                release: release_date
            };
        }
        acc[id].count++;
        return acc;
    }, {});
    const albumsSorted = Object.entries(albums).sort((a, b) => b[1].count - a[1].count);
    return Object.fromEntries(albumsSorted);
};
export default function (data) {
    return runWorker1(data);
}