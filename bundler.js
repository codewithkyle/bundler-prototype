const glob = require('glob');
const rimraf = require('rimraf');
const fs = require('fs');
const npmPackage = require('./package.json');

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
            let imports = await this.getImportStatements(files);
            imports = await this.purgeDuplicateImports(imports);
            imports = await this.getImportTypes(imports);
            // Bundle imports
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

            const imports = [];
            let filesParsed = 0;

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

                            const newImport = { name: importName, file: fileName };
                            imports.push(newImport);
                        }
                    }

                    filesParsed++;

                    if (filesParsed === files.length)
                    {
                        resolve(imports);
                    }
                });
            }
        });
    }

    purgeDuplicateImports(imports)
    {
        console.log('Removing duplicate imports');
        return new Promise((resolve, reject)=>{
            if(!imports)
            {
                reject('Can\'t purge imports if no import objects are provided');
            }

            const uniqueImports = [];

            for (let i = 0; i < imports.length; i++)
            {
                let isUnique = true;
                for (let k = 0; k < uniqueImports.length; k++)
                {
                    if (uniqueImports[k].name === imports[i].name)
                    {
                        isUnique = false;
                        break;
                    }
                }

                if (isUnique)
                {
                    uniqueImports.push(imports[i]);
                }
            }

            resolve(uniqueImports);
        });
    }

    getImportTypes(imports)
    {
        console.log('Setting import types');
        return new Promise((resolve)=>{
            for (let i = 0; i < imports.length; i++)
            {
                imports[i].type = 'global';

                for (const key of Object.keys(npmPackage.dependencies))
                {
                    if (imports[i].name === key || imports[i].file === key)
                    {
                        imports[i].type = 'npm';
                        break;
                    }
                }
            }

            resolve(imports);
        });
    }
}

new Bundler();