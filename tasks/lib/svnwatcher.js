/*
 * grunt-watch-svn
 * https://github.com/fencim/watch-svn
 *
 * Copyright (c) 2015 Lucman Abdulrachman
 * Licensed under the MIT license.
 */
'use strict';

var path = require('path');
var util = require('util'),
    grunt;
// run SVN command
var svnCMD = function (cmd, repo, options) {
    return function (done) {
        var process = grunt.util.spawn({
            cmd: 'svn',
            args: cmd,
            opts: options || {
                stdio: 'inherit'
            }
        }, done);
        return process;
    };
};
var execSvn = function (repo, options, done, svnArgs) {
    var relPath = {},
        cmd, dir;
    // Make sure we have a repo
    if (!repo.repo) {
        return;
    }
    // parse the repo name
    if (repo.dir) {
        dir = repo.dir;
    } else {
        dir = repo.repo.match(/\/([^\/]+?)(?:.svn)?(?:\/)?$/);
        if (!dir[1]) {
            grunt.log.warn('There was some trouble parsing the repository ' + repo.repo);
            return;
        }
        dir = dir[1];
    }

    // Set up working paths.
    relPath.outer = path.join.apply(this, repo.path);
    relPath.inner = relPath.outer + path.sep + dir;

    // validate outer directory
    if (!grunt.file.isDir(relPath.outer)) {
        grunt.log.warn('The directory "' + relPath + '" not found.');
        return;
    }

    // Set up pull or clone
    if (grunt.file.isDir(relPath.inner + path.sep + '.svn')) {
        if (svnArgs instanceof Array) {
            cmd = svnArgs.concat([relPath.inner]);
        } else {
            cmd = ['log', '-v', '-r', 'BASE:HEAD', relPath.inner];
        }
    } else {
        if (!grunt.file.isDir(relPath.inner)) {
            grunt.file.mkdir(relPath.inner);
        }
        cmd = ['checkout', repo.repo, relPath.inner];
        options = undefined;
    }
    return svnCMD(cmd, repo.repo, options)(done || function () {});
};
var Watcher = function (repos, options, initCallback) {
    var self = this,
        DEFAULT_INTERVAL = 1000;
    this._subscriptions = {};
    this._initialized = false;
    this._options = options || {};
    this._repos = repos;
    if (false != options.watch) {
        this._timer = setInterval(function () {
            self._checkChanges();
        }, this._options.interval || DEFAULT_INTERVAL);
    }
    self._checkChanges();
    self._initialize(initCallback);
};
Watcher.prototype = {
    close: function () {
        clearInterval(this._timer);
        this._timer = undefined;
    },
    on: function (evt, callback) {
        var evName = (evt + '').toUpperCase(),
            evList;
        switch (evName) {
        case 'DELETED':
        case 'D':
            evName = 'D';
            break;
        case 'ADDED':
        case 'A':
            evName = 'A';
            break;
        case 'MODIFIED':
        case 'M':
            evName = 'M';
            break;
        case 'REPLACED':
        case 'R':
            evName = 'R';
            break;
        case '*':
        case 'ALL':
            evName = '[AMDRC]';
            break;
        default:
            evName = null;
            break;
        }
        if (evName) {
            evList = this._subscriptions[evName] || [];
            this._subscriptions[evName] = evList;
            evList.push(callback);
        }
    },
    _initialize: function (initCallback) {
        if (!this._initialized) {
            this._initialized = true;
            initCallback.call(this);
        }
    },
    _checkForChangeOnRepo: function (repo, done) {
        var self = this,
            consoleOut = '',
            stdout;
        stdout = execSvn(repo, {
            stdio: ['pipe', 'pipe', process.stderr],
            encoding: 'utf8'
        }, function () {
            if (repo.firstCheck) {
                self._onCmd(repo, "\n C " + repo.dir)
            }
            done();
        }).stdout;
        if (stdout) {
            repo.firstCheck = false;
            stdout.on('data', function (data) {
                consoleOut += data;
            });
            stdout.on('end', function () {
                self._onCmd(repo, consoleOut);
            });
        } else {
            repo.firstCheck = true;
        }
    },
    _checkChanges: function () {
        var nRepo,
            stdout,
            repoLen,
            countDown,
            self = this;
        if (!self._checking) {
            repoLen = this._repos.length;
            countDown = repoLen;
            self._checking = (countDown > 0);
            for (nRepo = 0; nRepo < repoLen; nRepo++) {
                this._checkForChangeOnRepo(this._repos[nRepo], function () {
                    countDown--;
                    self._checking = (countDown > 0);
                });
            }
        }
    },
    _fireEvent: function (evName, repo, changedFiles, evCallList) {
        evCallList = evCallList || this._subscriptions[evName] || [];
        var nCall, evDesc;
        switch (evName) {
        case 'D':
            evDesc = 'DELETED';
            break;
        case 'A':
            evDesc = 'ADDED';
            break;
        case 'M':
            evDesc = 'MODIFIED';
            break;
        case 'R':
            evDesc = 'REPLACED';
            break;
        case 'C':
            evDesc = 'CHECKOUT';
            break;
        default:
            evDesc = null;
            break;
        }
        if (evDesc) {
            for (nCall = 0; nCall < evCallList.length; nCall++) {
                (evCallList[nCall]).call(this, evDesc, repo, changedFiles);
            }
        }
        if (evDesc !== 'CHECKOUT') {
            execSvn(repo, undefined, undefined, ['update']);
        }
    },
    _onCmd: function (repo, consoleOut) {
        if (typeof consoleOut !== 'string') {
            return;
        }
        var evNames = Object.keys(this._subscriptions),
            evName, nEv, matches, match, exp, changedFiles, changeType, MATCH_CHANGE_TYPE = 1,
            MATCH_CHANGED_FILE = 2;
        for (nEv = 0; nEv < evNames.length; nEv++) {
            evName = evNames[nEv];
            exp = "\n\\s+(" + evName + ") (.*)";
            matches = consoleOut.match(new RegExp(exp, 'g'));
            if (matches) {
                changedFiles = [];
                for (var nMatch = 0; nMatch < matches.length; nMatch++) {
                    match = matches[nMatch].match(new RegExp(exp));
                    changeType = changeType || match[MATCH_CHANGE_TYPE];
                    changedFiles.push(match[MATCH_CHANGED_FILE]);
                }
                this._fireEvent(changeType, repo, changedFiles, this._subscriptions[evName]);
            }
        }
    }
};
module.exports = function (_grunt) {
    grunt = _grunt;
    return {
        Watcher: Watcher
    };
};
module.exports.Watcher = Watcher;