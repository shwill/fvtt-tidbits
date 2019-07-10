let importActorFolderToCompendium = (folderName, compendiumName) => {
    var compendium = game.packs.find(p => p.collection === compendiumName);
    var folder = game.folders.entities.filter((f) => f.data.name === folderName);

    if (compendium && folder) {
        folder[0].data.content.forEach((actor) => {
            compendium.getIndex().then(index => {
                let entry = index.find(e => e.name === ((actor) .name));
                if (entry === undefined) {
                    console.log('Actor missing, creating: ' + actor.name);
                compendium.importEntity(actor);
                } else {
                    console.log('Actor existing, skipping: ' + actor.name);
                }
            });
        });
    }
}
