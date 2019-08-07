const glob = require('glob');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
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
            await this.makeBundleDirectory();
            await this.bundleImports(imports);
            // Update import statements
            await this.removeBundleDirectory();
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

    makeBundleDirectory()
    {
        console.log('Creating temporary bundle directory');
        return new Promise((resolve, reject)=>{
            fs.mkdir('./_bundled', (error)=>{
                if (error)
                {
                    reject(error);
                }

                resolve();
            });
        });
    }

    bundleImports(imports)
    {
        console.log('Bundling imports');
        return new Promise((resolve, reject)=>{
            if(!imports)
            {
                reject('Can\'t bundle non-existing imports');
            }

            let completed = 0;
            for (let i = 0; i < imports.length; i++)
            {
                switch (imports[i].type)
                {
                    case 'npm':
                        this.bundleNPM(imports[i])
                        .then(()=>{
                            completed++;

                            if (completed === imports.length)
                            {
                                resolve();
                            }
                        });
                        break;
                    case 'global':
                        this.bundleGlobal(imports[i])
                        .then(()=>{
                            completed++;

                            if (completed === imports.length)
                            {
                                resolve();
                            }
                        });
                        break;
                    default:
                        console.log('Unknown import type:', imports[i].type);
                        break;
                }
            }
        });
    }

    bundleNPM(importObj)
    {
        return new Promise(async (resolve, reject)=>{

            let npmOrg = '';
            let subPaths = importObj.file.replace(/\@.*?\//, '').split('/');
            let npmName = subPaths[0];

            if (importObj.file.match(/\@/))
            {
                npmOrg = importObj.file.match(/\@.*?\//)[0];
                npmOrg = npmOrg.replace(/\//, '');
                npmOrg = npmOrg.trim();
            }

            let packageFilePath = '';
            if (npmOrg)
            {
                packageFilePath += npmOrg + '/';
            }
            packageFilePath += npmName;
            packageFilePath += '/package.json';

            const npmPackage = require(packageFilePath);
            
            let initialFilePath = `node_modules/${ importObj.file }.js`;
            if (npmPackage['browser'])
            {
                initialFilePath = `node_modules${ (npmOrg) ? '/' + npmOrg : '' }/${ npmName }/${ npmPackage['browser'][Object.keys(npmPackage['browser'])[0]].match(/(?![\.\/]).*/)[0] }`;
            }

            let requiredModules = [ initialFilePath ];

            let loopCount = 0;

            do
            {
                loopCount++;
                console.log(loopCount, requiredModules);
                const data = await this.readFile(requiredModules[0]);
                const newModules = await this.getRequiredNodeModules(data);

                if (newModules)
                {

                    const currentPath = requiredModules[0].match(/.*(?=\/)/)[0];
                    const newModulePaths = await this.getNodeModulePaths(newModules, currentPath);

                    if (newModulePaths)
                    {
                        requiredModules = [...requiredModules, ...newModulePaths];
                    }
                }

                requiredModules.splice(0, 1);
            }
            while (requiredModules.length);
        });
    }

    getNodeModulePaths(modules, basePath)
    {
        return new Promise(async (resolve, reject)=>{
            const newModulePaths = [];

            for (let i = 0; i < modules.length; i++)
            {
                let modulePath = basePath + modules[i].path + '.js';
                newModulePaths.push(modulePath);
            }

            resolve(newModulePaths);
        });
    }

    readFile(path)
    {
        return new Promise((resolve, reject)=>{
            fs.readFile(path, (error, buffer)=>{
                if (error)
                {
                    reject(error);
                }
    
                const data = buffer.toString();
                resolve(data);
            });
        });
    }

    getRequiredNodeModules(data)
    {
        const requiredModules = [];
        const requiredFiles = data.match(/((var)|(const)|(let)).*(require).*?\;/g);

        if (requiredFiles)
        {
            for (let i = 0; i < requiredFiles.length; i++)
            {
                let filePath = requiredFiles[i].match(/[\'\"].*?[\'\"]/)[0];
                filePath = filePath.replace(/[\'\"\.]/g, '');
                filePath = filePath.trim();

                let moduleVariable = requiredFiles[i].match(/(?=(var)|(let)|(const)).*?(?<=\=)/)[0];
                moduleVariable = moduleVariable.replace(/((var)|(let)|(const)|(\=)|(\s))/, '');

                const newRequiredModule = { var: moduleVariable, path: filePath };
                requiredModules.push(newRequiredModule);
            }
        }

        return requiredModules;
    }

    bundleGlobal(importObj)
    {
        return new Promise(async (resolve)=>{
            resolve();
        });
    }

    removeBundleDirectory()
    {
        rimraf('./_bundled', (error)=>{
            if (error)
            {
                reject(error);
            }
        });
    }
}

new Bundler();