# Node.js jsdoc-to-markdown setup for project

1. Make sure Node.js is [installed](https://nodejs.org/en/download/).

2. Open Node.js command prompt.

3. cd to project directory.

4. Install jsdoc-to-markdown.

```
npm install --save-dev jsdoc-to-markdown
```

# Generate README.md from guide.md and module JSDoc markup.

1. Copy and paste the .js code w/ JSDoc markup to a module.js file.

2. Open Node.js command prompt.

3. cd to project directory.

4. Execute the jsdoc2md command and pipe result to a file.

```
npx jsdoc2md msslib.js > jsdoc.md
```

5. Find/replace ## > ### and adjust level for Constants and Functions.

```
powershell -Command "(Get-Content jsdoc.md) -replace '##', '###' | Out-File -encoding ASCII jsdoc.md"

powershell -Command "(Get-Content jsdoc.md) -replace '### Constants', '#### Constants' -replace '### Functions', '#### Functions' | Out-File -encoding ASCII jsdoc.md"

powershell -Command "(Get-Content jsdoc.md) -replace [RegEx]::Escape('???'), [RegEx]::Escape('>') | Out-File -encoding ASCII jsdoc.md"
```

6. Concatenate the guide and the jsdoc.

```
powershell -Command "Get-Content guide.md, jsdoc.md | Set-Content README.md"
```
