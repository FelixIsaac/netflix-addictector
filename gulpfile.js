const del = require('del');
const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const gulpif = require('gulp-if');
const filter = require('gulp-filter');
const jeditor = require("gulp-json-editor");
const zip = require('gulp-zip');
const manifest = require('./src/manifest.json');

const paths = {
    src: './src/',
    dist: './dist/',
    cssDir: './src/assets/css/',
};

/**
 * Build process:
 * 1. Remove unnecessary files (e.g. blocked.html)
 * 2. Concat files
 * 3. Minify everything (js, css, html)
 * 4. Optimize images
 * 5. Replace things
 * 6. Update manifest
 */

gulp.task('cleanup', function () {
    return del(paths.dist);
})

gulp.task('pack-js', function () {
    return gulp.src(
        [
            'scripts/events.js',
            'scripts/tabs.js',
            'scripts/utils.js',
            'scripts/alarm.js'
        ].map((path) => paths.src + path)
    )
        .pipe(concat('background.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist))
        .pipe(gulp.src(
            [
                "content.js",
                "scripts/utils.js",
                "scripts/timer.js",
                "scripts/screen-blocker.js"
            ].map((path) => paths.src + path)
        ))
        // .pipe(concat('content.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist + "scripts"));
});

gulp.task('default', gulp.series([
    'cleanup',
    gulp.parallel(['pack-js', 'pack-css', 'pack-html'])
]));
