const glob = require('glob');
const rimraf = require('rimraf');
const fs = require('fs');

class Bundler
{
    constructor()
    {
        fs.promises.access('docs/assets')
        .then(()=>{
            rimraf.sync('docs/assets');
        })
        .catch(()=>{
            console.log('No assets directory found');
        })
        .finally(()=>{
            fs.mkdir('docs/assets', (error)=>{
                if (error)
                {
                    throw error;
                }

                this.run();
            });
        });
    }

    async run()
    {
        try
        {
            console.log('Running the bundler');
        }
        catch (error)
        {
            throw error;
        }
    }
}

new Bundler();