# ATLAS Map UI
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/O5O33VK5S)

The ATLAS Map UI can be utilized to create your own resource map for a custom server.

1. Download the [latest build](https://github.com/antihax/atlasmap-js/releases/latest/download/dist.tar.gz)
2. Copy the json output directory from the [ATLAS Extract Plugin](https://github.com/antihax/ATLAS-Extract-Plugin)
3. Generate the slippy map tiles using the latest ServerGridEditor from Grapeshot Games and place in the tiles directory.
4. The final structure should be similar to as follows:
```
├── icons
│   ├── **/*.svg
├── images
│   ├── **/*.png
├── json
│   ├── **/*.json
├── tiles
│   ├── 0
│   ├── ...
│   ├── 6
├ atlasmap.js
├ example.html
├ style.css
```

# Development
This requires npm for development.

## Live Coding
Launch a webserver and webpack watch to allow live coding.
The `./public` folder will need basic json export and tiles added.
```
npm run dev
```


## Development build
```
npm run build:dev
```

You can use `npx http-server ./dev` to view development 

## Distribution Build
```
npm run build
```