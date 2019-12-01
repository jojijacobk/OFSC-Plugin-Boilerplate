# Boilerplate plugin for OFSC

## Installation instructions:

### Dependencies

Project uses [NodeJS](https://nodejs.org), first of all you need to install it.

Project uses [Grunt](https://gruntjs.com/) as a task runner for building. Run the bellow command to install grunt command line interface:

    # npm install -g grunt-cli

To install all required NPM dependencies, cd to the project root and run:

    $ npm install

### Building the package

In order to build resources use the command:

    $ grunt

After build you will have the "/build" folder which contains plugin files and zip archive which you can use by "Hosted Plugins" feature of OFSC.

#### Versioning

Every time you build the package, the version is updated automatically, so **don't forget to commit and push the `package.json`** to have the package storage and source repository synced.

Build updates the third number in version string along with timestamp, e.g. `178.0.X+YYYYYYYYYYYYY`, where X and Y are updatable parts.

To update the first number, run the following manually:

    $ grunt bumpup:major

To update the second number, run this:

    $ grunt bumpup:minor

Please notice, that timestamp part will be lost in this case, so after manual version bump you should run build again.
