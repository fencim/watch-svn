/*
 * grunt-watch-svn
 * https://github.com/fencim/watch-svn
 *
 * Copyright (c) 2015 Lucman Abdulrachman
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    meta: {       
        src: {
            svnBase: 'http://153.59.98.147/svn/repos/pa'
        }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    "watch-svn": {
      standard_docs: {
          repos : [{
            dir: 'source/std',  
            repo: '<%= meta.src.svnBase %>/res/Others/StandardService/'
          }],
          tasks: ['clean']
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['watch-svn']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
