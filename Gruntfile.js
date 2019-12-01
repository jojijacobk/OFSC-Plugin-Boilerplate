"use strict";

module.exports = function (grunt) {

    const outputDir = 'build';
    const now = +(new Date());

    grunt.registerTask('autoIncrementVersion', 'Auto increment package version on every build', () => {
        grunt.task.run('bumpup:patch:' + now);
    });

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bumpup: {
            options: {
                updateProps: {
                    pkg: 'package.json'
                }
            },
            files: ['package.json']
        },
        clean: {
            start: [ outputDir + '/*' ],
            finish: []
        },
        copy: {
            main: {
                expand: true,
                cwd: 'src',
                src: '**',
                dest: outputDir + '/',
            },
        },
        zip: {
            compress: {
                cwd: outputDir + '/',
                src: [ outputDir + '/*.*' ],
                dest: outputDir + '/<%= pkg.name %>-<%= pkg.version %>.zip'
            }
        }
    });

    grunt.loadNpmTasks('grunt-bumpup');

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-zip');

    grunt.registerTask('build', [
        'clean:start',
        'copy',
        'clean:finish',
        'autoIncrementVersion',
        'zip'
    ]);
    grunt.registerTask('default', ['build']);
};
