let scaleTokensToGridSize = () => {
    Hooks.on('preCreateToken', (sceneId, token) => {

        // get the scene
        let scene = game.scenes.get(sceneId);
        
        // if the scenes grid distance is measured in feet, we
        // will scale the token according to the scene itself
        if (scene.data.gridUnits.indexOf('ft') !== -1) {
            // get the grid size
            let gridSize = scene.data.gridDistance;

            // grid units at 5ft are:
            let sizes = new Map();
            sizes.set('tiny', 0.5);
            sizes.set('sm', 1);
            sizes.set('med', 1);
            sizes.set('lg', 2);
            sizes.set('huge', 3);
            sizes.set('grg', 4);

            // get the actor size
            let actor = game.actors.get(token.actorId);
            let actorSize = actor.data.data.traits.size;

            // let's see if we have info about the grid-units a create
            // of this size should occupy on a 5ft grid
            if (sizes.has(actorSize.value)) {
                let targetSize = sizes.get(actorSize.value);
                let scale = 5 / gridSize;

                // Props to @ayan, suggesting a grid width/height of 1/1 and instead scaling the icon 
                // down to leave it centered on the tile
                if (targetSize < 1) {
                    scale *= targetSize;
                    targetSize = 1;
                }
                
                // then scale the token if the map has a grid != 5ft
                // scale is 1 for a map with 5ft grid, so it won't be changed
                token.scale = scale;
                token.width = targetSize;
                token.height = targetSize;
            }
        }
    });
};