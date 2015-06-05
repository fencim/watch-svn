# grunt-watch-svn

> Grunt plugin to watch change on SVN

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-watch-svn --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-watch-svn');
```

## watch-svn task
_Run this task with the `grunt watch-svn` command._


### Settings

There are a number of options available. Please review the [minimatch options here](https://github.com/isaacs/minimatch#options). As well as some additional options as follows:

#### repos
Type: `Array`

This defines what repositories this task will watch. Is an array of objects with dir and repo properties.

#### repos[].dir
Type: `String`

This defines the location of local base directory. .

#### tasks
Type: `String|Array`

This defines which tasks to run when a watched repository event occurs.

#### options.spawn
Type: `Boolean`
Default: true

Whether to spawn task runs in a child process. Setting this option to `false` speeds up the reaction time of the watch (usually 500ms faster for most) and allows subsequent task runs to share the same context. Not spawning task runs can make the watch more prone to failing so please use as needed.

Example:
```js
"watch-svn": {
  scripts: {
    repos: [{
      dir : 'source/target',
      repo : 'http://svnserver/svn/target/branches/wip'
    }],
    tasks: ['jshint'],
    options: {
      spawn: false,
    },
  },
},
```

*For backwards compatibility the option `nospawn` is still available and will do the opposite of `spawn`.*

#### options.interrupt
Type: `Boolean`
Default: false

As files are modified this watch task will spawn tasks in child processes. The default behavior will only spawn a new child process per target when the previous process has finished. Set the `interrupt` option to true to terminate the previous process and spawn a new one upon later changes.

Example:
```js
"watch-svn": {
  scripts: {
    repos: [{
      dir : 'source/target',
      repo : 'http://svnserver/svn/target/branches/wip'
    }],
    tasks: ['jshint'],
    options: {
      interrupt: true,
    },
  },
},
```

#### options.debounceDelay
Type: `Integer`
Default: 500

How long to wait before emitting events in succession for the same filepath and status. For example if your `Gruntfile.js` file was `changed`, a `changed` event will only fire again after the given milliseconds.

Example:
```js
"watch-svn": {
  scripts: {
    repos: [{
      dir : 'source/target',
      repo : 'http://svnserver/svn/target/branches/wip'
    }],
    tasks: ['jshint'],
    options: {
      debounceDelay: 250,
    },
  },
},
```

#### options.interval
Type: `Integer`
Default: 1000

The `interval` is passed to svnwatcher. This defines the time interval between svn update check; it is recommended to ignore this option. *Default is 1000ms*.

#### options.event
Type: `String|Array`
Default: `'all'`

Specify the type watch event that trigger the specified task. This option can be one or many of: `'all'`, `'modified'`, `'added'`, `'replaced'` and `'deleted'`. This options equivalent shorten to : `'*'`, `'m'`, `'a'`, `'r'` and `'d'` 

Example:
```js
"watch-svn": {
  scripts: {
    repos: [{
      dir : 'source/target',
      repo : 'http://svnserver/svn/target/branches/wip'
    }],
    tasks: ['generateFileManifest'],
    options: {
      event: ['added', 'deleted'],
    },
  },
},
```

#### options.forever
Type: `Boolean`
Default: true

This is *only a task level option* and cannot be configured per target. By default the watch task will duck punch `grunt.fatal` and `grunt.warn` to try and prevent them from exiting the watch process. If you don't want `grunt.fatal` and `grunt.warn` to be overridden set the `forever` option to `false`.

#### options.dateFormat
Type: `Function`

This is *only a task level option* and cannot be configured per target. By default when the watch has finished running tasks it will display the message `Completed in 1.301s at Thu Jul 18 2013 14:58:21 GMT-0700 (PDT) - Waiting...`. You can override this message by supplying your own function:

```js
"watch-svn": {
  options: {
    dateFormat: function(time) {
      grunt.log.writeln('The watch finished in ' + time + 'ms at' + (new Date()).toString());
      grunt.log.writeln('Waiting for more changes...');
    },
  },
  scripts: {
    repos: [{
      dir : 'source/target',
      repo : 'http://svnserver/svn/target/branches/wip'
    }],
    tasks: 'jshint',
  },
},
```

#### options.atBegin
Type: `Boolean`
Default: false

This option will trigger the run of each specified task at startup of the watcher.


### Examples

```js
// Simple config to run jshint any time a file is added, changed or deleted
grunt.initConfig({
  "watch-svn": {
    repos: [{
      dir : 'source/target',
      repo : 'http://svnserver/svn/target/branches/wip'
    }],
    tasks: ['jshint'],
  },
});
```

```js
// Advanced config. Run specific tasks when specific files are added, changed or deleted.
grunt.initConfig({
  "watch-svn": {
    gruntfile: {
      repos: [{
        dir : 'source/target',
        repo : 'http://svnserver/svn/target/branches/wip'
      }],
      tasks: ['jshint:gruntfile'],
    },
    src: {
      repos: [{
        dir : 'source/target',
        repo : 'http://svnserver/svn/target/branches/wip'
      }],
      tasks: ['default'],
    },
    test: {
      files: '<%= jshint.test.src %>',
      tasks: ['jshint:test', 'qunit'],
    },
  },
});
```

#### Using the `watch-svn` event
This task will emit a `watch` event when watched files are modified. This is useful if you would like a simple notification when files are edited or if you're using this task in tandem with another task. Here is a simple example using the `watch` event:

```js
grunt.initConfig({
  "watch-svn": {
    scripts: {
      repos: [{
        dir : 'source/target',
        repo : 'http://svnserver/svn/target/branches/wip'
      }],
    },
  },
});
grunt.event.on('watch', function(action, filepath, target) {
  grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
});
```

**The `watch` event is not intended for replacing the standard Grunt API for configuring and running tasks. If you're trying to run tasks from within the `watch` event you're more than likely doing it wrong. Please read [configuring tasks](http://gruntjs.com/configuring-tasks).**

##### Compiling Files As Needed
A very common request is to only compile files as needed. Here is an example that will only lint changed files with the `jshint` task:

```js
grunt.initConfig({
  "watch-svn": {
    scripts: {
      repos: [{
        dir : 'source/target',
        repo : 'http://svnserver/svn/target/branches/wip'
      }],
      tasks: ['jshint'],
      options: {
        spawn: false,
      },
    },
  },
  jshint: {
    all: ['lib/*.js'],
  },
});

// on watch events configure jshint:all to only run on changed file
grunt.event.on('watch-svn', function(action, repo, changedFiles) {
  grunt.config(['jshint', 'all'], repo.dir);
});
```



### FAQs


#### Why spawn as child processes as a default?
The goal of this watch task is as files are changed, run tasks as if they were triggered by the user themself. Each time a user runs `grunt` a process is spawned and tasks are ran in succession. In an effort to keep the experience consistent and continually produce expected results, this watch task spawns tasks as child processes by default.

Sandboxing task runs also allows this watch task to run more stable over long periods of time. As well as more efficiently with more complex tasks and file structures.

Spawning does cause a performance hit (usually 500ms for most environments). It also cripples tasks that rely on the watch task to share the context with each subsequent run (i.e., reload tasks). If you would like a faster watch task or need to share the context please set the `spawn` option to `false`. Just be aware that with this option enabled, the watch task is more prone to failure.

## Credits
This project would not be possible without the following author and projects:
* [grunt-contrib-watch]Grunt Team "Cowboy" Ben Alman (https://github.com/gruntjs/grunt-contrib-watch)
* [grunt-svn-checkout]Luke Woodward (https://github.com/lkwdwrd/grunt-svn-checkout)
## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* 0.1.6 - Initial
