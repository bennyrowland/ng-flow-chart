var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var mainBowerFiles = require('gulp-main-bower-files');
var es = require('event-stream');
var nodemon = require('gulp-nodemon');

var paths = {
    distDemo: './demo',
    distLib: './distDemo/lib',
    index: './src/demo/index.html',
    libPartials: './src/lib/**/*.html',
    libStyles: './src/lib/**/*.scss',
    srcLib: './src/lib/**/*.js',
    srcApp: './src/demo/app.js'
};

var pipes = {};

pipes.builtAppScripts = function () {
    return gulp.src(paths.srcApp)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(gulp.dest(paths.distDemo));
};

pipes.builtExternalScripts = function() {
    return gulp.src('./bower.json')
        .pipe(mainBowerFiles({includeDev: true}))
        .pipe(gulp.dest(paths.distDemo))
};

pipes.builtLibScripts = function() {
    return gulp.src(paths.srcLib)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(gulp.dest(paths.distLib))
};

pipes.compiledPartials = function() {
    return gulp.src(paths.libPartials)
        .pipe(plugins.angularTemplatecache({module: 'flowchart'}))
        .pipe(gulp.dest(paths.distLib));
};

pipes.builtStyles = function() {
    return gulp.src(paths.libStyles)
        .pipe(plugins.sass())
        .pipe(gulp.dest(paths.distLib))
};

pipes.copiedStyles = function() {
    return pipes.builtStyles()
        .pipe(gulp.dest(paths.distDemo))
};

pipes.builtLib = function() {
    return es.merge(pipes.builtLibScripts(), pipes.compiledPartials());
};

pipes.copiedLibScripts = function() {
    return pipes.builtLib()
        .pipe(gulp.dest(paths.distDemo));
};

pipes.validatedIndex = function() {
    return gulp.src(paths.index)
        .pipe(plugins.htmlhint())
        .pipe(plugins.htmlhint.reporter());
};

pipes.builtIndex = function() {
    var externalScripts = pipes.builtExternalScripts();
    var orderedLibScripts = pipes.copiedLibScripts().pipe(plugins.angularFilesort());
    var libStyles = pipes.copiedStyles();
    var libInjections = es.merge(orderedLibScripts, libStyles);

    var appScripts = pipes.builtAppScripts();

    return pipes.validatedIndex()
        .pipe(gulp.dest(paths.distDemo))
        .pipe(plugins.inject(externalScripts, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(libInjections, {relative: true}))
        .pipe(gulp.dest(paths.distDemo));
};

pipes.builtDemo = function() {
    return pipes.builtIndex();
};

gulp.task('build-demo', pipes.builtDemo);

gulp.task('watch-demo', ['build-demo'], function() {
    // watch index
    gulp.watch(paths.srcApp, function() {
        return pipes.builtAppScripts()
            .pipe(plugins.print());
    });
    gulp.watch(paths.index, function() {
        return pipes.builtIndex();
    });
    gulp.watch(paths.srcLib, function() {
        return pipes.copiedLibScripts();
    });
    gulp.watch(paths.libPartials, function() {
        return pipes.copiedLibScripts();
    });
    gulp.watch(paths.libStyles, function() {
        return pipes.copiedStyles();
    });
    nodemon({
        exec: 'node ./node_modules/simplehttpserver/simplehttpserver.js demo',
        ext: 'js html json css',
        verbose: true,
        watch: 'demo'
    })
        .on('restart', function() { console.log('restarted'); })
});