# BYOB: Bring Your Own Bundler

The purpose of this prototype is to experiment with the idea of building a custom bundler. Webpack works well for SPAs but fails to code split the bundles into small reusable chunks.

## Possible Solutions

1. Use a custom [rollup](https://rollupjs.org/) script as the bundler (checkout my [web components prototype](https://github.com/codewithkyle/web-components-prototype) for an example)
2. Manually bundle files using nodejs & the FS api [file system api](https://nodejs.org/api/fs.html)

## Project Outline

1. Parse JavaScript files for imports ✅
1. Remove duplicate imports ✅
1. Split bundles into local scripts and node modules ✅
1. Recursively parse node module dependencies
1. Bundle node modules
1. Bundle local scripts
1. Create runtime application for loading required scripts

## Goals

- Bundle local scripts
- Bundle node modules
- Runtime application
    - Imports dependencies
    - Limits file request when the same import is required for multiple files
    - Delays script instantiation until all dependencies are loaded

## Script Lifecycle

1. Runtime application parsed & loaded
1. Script 1 and Script 2 parsed & loaded
    - Script 1 Requires: Env & UUID
    - Script 2 Requires: Env
1. Script 1 requests Env and UUID scripts from the runtime application
1. Runtime application beings loading Env and UUID
1. Script 2 requests Env from the runtime application
1. Runtime application ignores request since Env is already requested and loading
1. Server responds with Env
1. Env is parsed and loaded
1. Custom loaded event is fired informing scripts of the Env load status
1. Script 1 hears the Env load event and checks if all dependencies have been met
1. Check fails Script 1 continues to wait
1. Script 2 hears the Env load event and checks if all dependencies have been met
1. Check passes, Script 2 is mounted, event listener removed
1. Server responds with UUID
1. UUID is parsed and loaded
1. Custom loaded event is fired informing scripts of the UUID load status
1. Scripts 1 hears the UUID load event and checks if all dependencies have been met
1. Check passes, Script 1 is mounted, event listener removed

## Postmortem

TODO: Write postmortem documentation after prototype is finished
