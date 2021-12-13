const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const gulpif = require('gulp-if');
const filter = require('gulp-filter');
const jeditor = require("gulp-json-editor");
const zip = require('gulp-zip');
const manifest = require('./src/manifest.json');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');

const paths = {
    src: './src/',
    dist: './dist/',
    cssDir: './src/assets/css/',
};

function distFileName(browserName, ext) {
    return `dist-${browserName}-v${manifest.version_name}.${ext}`;
}

async function cleanup(cb) {
    del(paths.dist, cb);
};

async function minify() {

}

async function postCSS() {
    return gulp.src(paths.src + '/assets/css/*.css')
        .pipe(autoprefixer({ cascade: false }))
        .pipe(gulp.dest(paths.dist + '/assets/css'));
}

async function dist(browserName, manifest) {

        // .pipe(gulpif('manifest.json', jeditor(manifest)))

        // .pipe(zip(distFileName(browserName, 'zip')))
}

// exports.cleanup = cleanup;
exports.default = gulp.series([
    cleanup,
    () =>     gulp.src(paths.src + '/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist)),
        
() => gulp.src(paths.cssDir + '*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest(paths.dist + '/assets/css'))
    // () => dist('chrome', manifest)
]);
