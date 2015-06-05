/*
 * grunt-watch-svn
 * https://github.com/fencim/watch-svn
 *
 * Copyright (c) 2015 Lucman Abdulrachman
 * Licensed under the MIT license.
 */

var path = require('path'),
    async = require('async'),
    watchers = [],
    changedRepos = Object.create(null),
    waiting = 'Waiting...';


module.exports = function(grunt) {

    'use strict';
    var taskrun = require('./lib/taskrunner')(grunt),
        Watcher = require('./lib/svnwatcher')(grunt).Watcher,
        self = this;

    // Default date format logged
    var dateFormat = function(time) {
        grunt.log.writeln(String(
            'Completed in ' +
            time.toFixed(3) +
            's at ' +
            (new Date()).toString()
        ).cyan + ' - ' + waiting);
    };

    // When task runner has started
    taskrun.on('start', function() {
        grunt.log.ok();
        Object.keys(changedRepos).forEach(function(repo) {
            // Log which repo has changed, and how.
            grunt.log.ok('Repo:"' + repo + '".');
            Object.keys(changedRepos[repo]).forEach(function(changeType) {
                 grunt.log.ok(changeType + ':');
                 for (var nFile = 0; nFile < changedRepos[repo][changeType].length; nFile++) {
                      grunt.log.ok(' File "' + changedRepos[repo][changeType][nFile] + '".');
                 };
            });
        });
        grunt.log.writeln();
        // Reset changedRepos
        changedRepos = Object.create(null);
    });
    // When task runner has ended
    taskrun.on('end', function(time) {
        if (time > 0) {
            dateFormat(time);
        }
    });

    // When a task run has been interrupted
    taskrun.on('interrupt', function() {
        grunt.log.writeln('').write('Scheduled tasks have been interrupted...'.yellow);
    });

    // When taskrun is reloaded
    taskrun.on('reload', function() {
        taskrun.clearRequireCache(Object.keys(changedRepos));
        grunt.log.writeln('').writeln('Reloading watch config...'.cyan);
    });

    grunt.registerTask('watch-svn', 'Watch SVN repos with Grunt', function(target) {
        var self = this;
        var name = self.name || 'watch';

        // Close any previously opened watchers
        watchers.forEach(function(watcher) {
            watcher.close();
        });
        watchers = [];

        // Never gonna give you up, never gonna let you down
        if (grunt.config([name, 'options', 'forever']) !== false) {
            taskrun.forever();
        }

        // If a custom dateFormat function
        var df = grunt.config([name, 'options', 'dateFormat']);
        if (typeof df === 'function') {
            dateFormat = df;
        }
        
        // initialize taskrun
        var targets = taskrun.init(name, {
            target: target
        });

        targets.forEach(function(target, i) {
            if (typeof target.repos === 'string') {
                target.repos = [target.repos];
            }
            // Process into raw patterns
            var patterns = grunt.util._.chain(target.repos).flatten().map(function(pattern) {
                return grunt.config.process(pattern);
            }).value();
            // Validate the event option
            if (typeof target.options.event === 'string') {
                target.options.event = [target.options.event];
            }    
            var watchCounter = 0;        
            watchers.push(new Watcher(patterns, target.options, function(err) {
                if (err) {
                    if (typeof err === 'string') {
                        err = new Error(err);
                    }
                    grunt.log.writeln('ERROR'.red);
                    grunt.fatal(err);
                    return taskrun.done();
                }
                watchCounter++;
                // Log all watched repos with --verbose set
                if (grunt.option('verbose')) {
                    var watched = this.watched();
                    Object.keys(watched).forEach(function(watchedRepos) {
                        watched[watchedRepos].forEach(function(watchedRepo) {
                            grunt.log.writeln('Watching ' + path.relative(process.cwd(), watchedRepo) + ' for changes.');
                        });
                    });
                }
                this.on('all', function(changeType, repoObj, paths) {
                    var changes;
                    if (false === target.options.watch) {
                        watchCounter--;
                        if (watchCounter <= 0) {
                            taskrun.done();
                            return;
                        }
                    }
                    // Skip events not specified
                    if (!grunt.util._.contains(target.options.event, 'all') &&
                        !grunt.util._.contains(target.options.event, status)) {
                        return;
                    }                    
                    // Emit watch events if anyone is listening
                    if (grunt.event.listeners('watch-svn').length > 0) {
                        //grunt.event.emit('watch-svn', changeType, repoObj, paths, target.name);
                    }

                    // Group changed repos only for display
                    changes = changedRepos[repoObj.repo] || {};
                    changedRepos[repoObj.repo] = changes;
                    changes[changeType] = paths;

                    // Add changed files to the target
                    if (taskrun.targets[target.name]) {
                        if (!taskrun.targets[target.name].changedrepos) {
                            taskrun.targets[target.name].changedrepos = Object.create(null);
                        }
                        changes = taskrun.targets[target.name].changedrepos[repoObj.repo] || {};
                        taskrun.targets[target.name].changedrepos[repoObj.repo] = changes;
                        changes[changeType] = paths;                        
                    }

                    // Queue the target
                    if (taskrun.queue.indexOf(target.name) === -1) {
                        taskrun.queue.push(target.name);
                    }
                    // Run the tasks
                    taskrun.run();
                });
                for (var nRepo = 0; nRepo < this._repos.length; nRepo++) {
                    var repo = this._repos[nRepo];
                    if (repo.firstCheck) {
                        grunt.log.writeln('Doing SVN checkout for ' + repo.dir);
                    } else {
                        grunt.log.writeln(waiting + ' ' + repo.dir);
                    }
                };                 
            }));

        });


    });

};