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
        console.log('Running the bundler');
        try
        {
            const files = await this.findFiles();
            await this.getImportStatements(files)// Parse files for import statements
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
        console.log('Finding compiled JavaScript files');
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
        console.log('Finding import statements');
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
                    const importStatements = data.match(/(import).*(from).*\;/g);

                    if(importStatements)
                    {
                        for (let k = 0; k < importStatements.length; k++)
                        {
                            let importName = importStatements[i].replace(/import/, '');
                            importName = importName.trim();
                            importName = importName.replace(/((\{)|(\*.*?as))/, '');
                            importName = importName.trim();
                            importName = importName.replace(/(\}|from).*?\;/, '');
                            importName = importName.trim();

                            let fileName = importStatements[i].match(/([\'\"].*?[\'\"])/)[0];
                            fileName = fileName.replace(/[\'\"]/g, '');
                            fileName = fileName.trim();

                            console.log(importName, fileName);
                        }
                    }
                });
            }

            resolve();
        });
    }
}

new Bundler();