const del = require('del');
const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const imagemin = import('gulp-imagemin');
const gulpif = require('gulp-if');
const jeditor = require("gulp-json-editor");
const manifest = require('./src/manifest.json');
const zip = require('gulp-zip');
const args = require('yargs').argv;
const bump = require('gulp-bump');

const paths = {
    src: './src/',
    dist: './dist/',
    build: './build/',
    cssDir: './src/assets/css/',
};

/**
 * Build process:
 * 1. Minify everything (js, css, html)
 * 2. Concat files
 * 3. Optimize images
 * 4. Replace things (path to files, etc.)
 * 5. Update manifest to match
 * 6. Remove unnecessary files (e.g. blocked.html)
 * 7. Zip files
 * 8. Test extension
 * 9. If tests pass, Push to stores Chrome, Firefox, Safari
 */

function buildString() {
    return manifest.version;
}

function distFileName(browserName = 'chrome', ext) {
    return `dist-${browserName}-v${buildString()}.${ext}`;
}

gulp.task('cleanup', function () {
    return del(paths.dist);
});

function packJS(src, dist, concatName) {
    return gulp.src(
        Array.isArray(src)
            ? src.map((path) => paths.src + path)
            : paths.src + src
    )
        .pipe(gulpif(!!concatName, concat(concatName || '404')))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist + dist));
}

gulp.task('pack-js', async function () {
    packJS(
        [
            'scripts/events.js',
            'scripts/tabs.js',
            'scripts/utils.js',
            'scripts/alarm.js'
        ],
        '', 'background.js'
    );

    packJS(
        [
            "content.js",
            "scripts/utils.js",
            "scripts/timer.js",
            "scripts/screen-blocker.js"
        ],
        'scripts'
    );

    packJS('options/options.js', 'options');
    packJS('popup/popup.js', 'popup');
});

gulp.task('pack-css', function () {
    return gulp.src(paths.src + 'assets/css/*.css')
        .pipe(cleanCSS())
        .pipe(autoprefixer())
        .pipe(gulp.dest(paths.dist + 'assets/css'));
});

gulp.task('pack-html', function () {
    return gulp.src(paths.src + "**/*.html")
        .pipe(htmlmin({
            collapseWhitespace: true,
            includeAutoGeneratedTags: false,
            minifyCSS: true,
            minifyJS: true,
            minifyURLs: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
        }))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('optimize-images', async function () {
    const imageOptimizer = await imagemin;

    return gulp.src(paths.src + "/assets/images/*")
        .pipe(
            imageOptimizer.default([
                imageOptimizer.optipng({ optimizationLevel: 7 }),
                imageOptimizer.svgo()
            ])
        )
        .pipe(gulp.dest(paths.dist + "/assets/images"));
});

gulp.task('manifest-update', async function () {
    gulp.src(paths.src + 'manifest.json')
        .pipe(jeditor(function (json) {
            const i = json.content_scripts[0].js
                .findIndex((script) => script.includes("content.js"));
            json.content_scripts[0].js[i] = "/scripts/content.js";

            return json;
        }))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('remove-unnecessary-files', async function () {
    return del(
        [
            'assets/blocked.html'
        ].map((path) => paths.dist + path)
    );
});

gulp.task('zip', async function (browserName) {
    gulp.src(paths.dist)
        .pipe(zip(distFileName(browserName, 'zip')))
        .pipe(gulp.dest(paths.build));
});

gulp.task('dist', gulp.series([
    'cleanup',
    gulp.parallel(['pack-js', 'pack-css', 'pack-html', 'optimize-images']),
    gulp.parallel(['manifest-update', 'remove-unnecessary-files'])
]));

gulp.task('bump', async function () {
    /// It bumps revisions
    /// Usage:
    /// 1. gulp bump : bumps the package.json and bower.json to the next minor revision.
    ///   i.e. from 0.1.1 to 0.1.2
    /// 2. gulp bump --version 1.1.1 : bumps/sets the package.json and bower.json to the 
    ///    specified revision.
    /// 3. gulp bump --type major       : bumps 1.0.0 
    ///    gulp bump --type minor       : bumps 0.1.0
    ///    gulp bump --type patch       : bumps 0.0.2
    ///    gulp bump --type prerelease  : bumps 0.0.1-2

    const type = args.type || 'patch';
    const version = args.version;

    const options = {
        version, type
    };

    gulp
        .src('./package.json')
        .pipe(bump(options))
        .pipe(gulp.dest('./'));

    gulp
        .src(paths.src + 'manifest.json')
        .pipe(bump(options))
        .pipe(gulp.dest(paths.src));
});

// gulp.task('deploy:chrome', function () {
//     axios.put(`https://www.googleapis.com/upload/chromewebstore/v1.1/items/${APP_ID}`, {
//         headers: {
//             'Authorization': `Bearer ${TOKEN}`,
//             'body': ''
//         }
//     });

// });

// gulp.task('deploy', gulp.series([
//     'dist',
//     'zip',
//     gulp.parallel([
//         'chrome', 'firefox', 'safari',
//     ])
// ]));
