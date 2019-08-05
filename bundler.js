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
            const files = this.findFiles();
            this.getImportStatements(files)// Parse files for import statements
            // Remove duplicate import statements
            // Get node modules
            // Get local scripts
            // Bundle node modules
            // Bundle local scripts
            // Update import statements
        }
        catch (error)
        {
            throw error;
        }
    }

    findFiles()
    {
        return new Promise((resolve, reject)=>{
            glob('./_compiled/**/*.js', (error, files)=>{
                if(error)
                {
                    reject(error);
                }

                resolve(files);
            });
        });
    }

    getImportStatements(files)
    {
        return new Promise((resolve, reject)=>{
            if(!files)
            {
                reject('Can\'t find imports statements from non-existent files');
            }

            for (let i = 0; i < files.length; i++)
            {
                fs.readFile(files[i], (error, buffer)=>{
                    if(error)
                    {
                        reject(error);
                    }

                    const data = buffer.toString();

                    if(data.match(/(import).*(from)/g))
                    {
                        
                    }
                });
            }
        });
    }
}

new Bundler();