var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var mainBowerFiles = require('gulp-main-bower-files');
var es = require('event-stream');
var nodemon = require('gulp-nodemon');

var paths = {
    distDemo: './demo',
    distLibDev: './distDemo/lib',
    distLib: './dist',
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

pipes.validatedLibScripts = function() {
    return gulp.src(paths.srcLib)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
};

pipes.builtLibScriptsDev = function() {
    return pipes.validatedLibScripts()
        .pipe(gulp.dest(paths.distLibDev))
};

pipes.builtLibScriptsDist = function() {
    return pipes.validatedLibScripts()
        .pipe(plugins.angularFilesort())
        .pipe(plugins.concat('ng-flow-chart.min.js'))
        //.pipe(plugins.uglify())
        .pipe(gulp.dest(paths.distLibDev));
};

pipes.compiledPartials = function() {
    return gulp.src(paths.libPartials)
        .pipe(plugins.angularTemplatecache({module: 'flowchart'}))
        .pipe(gulp.dest(paths.distLibDev));
};

pipes.builtStyles = function() {
    return gulp.src(paths.libStyles)
        .pipe(plugins.sass())
        .pipe(gulp.dest(paths.distLibDev))
};

pipes.copiedStyles = function() {
    return pipes.builtStyles()
        .pipe(gulp.dest(paths.distDemo))
};

pipes.builtLib = function() {
    return es.merge(pipes.builtLibScriptsDev(), pipes.compiledPartials());
};

pipes.builtLibDist = function () {
    return es.merge(pipes.builtLib()
        .pipe(plugins.angularFilesort())
        .pipe(plugins.concat('ng-flow-chart.min.js')), pipes.builtStyles()
        .pipe(plugins.concat('ng-flow-chart.css')))
        .pipe(gulp.dest(paths.distLib))
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

gulp.task('build-lib', pipes.builtLibDist);

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