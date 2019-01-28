console.clear()

const gulp = require('gulp')
const sass = require('gulp-sass')
const sourcemaps = require('gulp-sourcemaps')
const gulpif = require('gulp-if')
const modifyCSSurls = require('gulp-modify-css-urls')
const notify = require('gulp-notify')
const size = require('gulp-size')
const csso = require('gulp-csso')
const replace = require('gulp-replace')
const autoprefixer = require('gulp-autoprefixer')
const imagemin = require('gulp-imagemin')
const imageminPngquant = require('imagemin-pngquant');
const imageminZopfli = require('imagemin-zopfli');
// const imageminMozjpeg = require('imagemin-mozjpeg')
const del = require('del')
const { exec } = require('child_process')
const package = require('./package.json')

const prod = process.env.NODE_ENV === 'production'

// clean up left over files
gulp.task('clean', done => {
    return del([
        'dist/**',
        'dist'
    ], done)
})

// start a node server
let server
gulp.task('server', () => {
    if (server)
        return

    server = exec(`node ${package.main}`, (error, stdout, stderr) => {
        if (error) console.error(error)
    })
})

// compile sass and transfer it to the public folder
gulp.task('css', () => {
    return gulp.src([
            '!src/sass/**/_*',
            'src/sass/*.{sass,scss}'
        ])
        .pipe(gulpif(!prod, sourcemaps.init()))
        .pipe(sass().on('error', notify.onError({
            title: 'SASS error',
            message: '<%= error.formatted %>'
        })))
        .pipe(gulpif(prod, modifyCSSurls({
            modify (url) {
                return `%%${url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))}%%`
            }
        })))
        .pipe(autoprefixer())
        .pipe(replace(':before', '::before'))
        .pipe(replace(':after', '::after'))
        .pipe(gulpif(prod, replace('@charset "UTF-8";', '')))
        .pipe(gulpif(prod, csso()))
        .pipe(gulpif(!prod, sourcemaps.write('.')))
        .pipe(size({
            title: '[size: css]',
            showFiles: true
        }))
        .pipe(gulp.dest('dist/css'))
})

// transfer images to the public folder
gulp.task('img', () => {
    return gulp.src(['src/img/*.{png,jpg}', 'src/img/**/*.{png,jpg}'])
        .pipe(gulpif(prod, imagemin([
            //png
            imageminPngquant({
                speed: 1,
                quality: 98 //lossy settings
            }),
            imageminZopfli({
                more: true
                // iterations: 50 // very slow but more effective
            }),
            //jpg lossless
            imagemin.jpegtran({
                progressive: true
            }),
            //jpg very light lossy, use vs jpegtran
            // imageminMozjpeg({
            //     quality: 90
            // })
        ])))
        .pipe(size({
            title: '[size: img]',
            showFiles: true
        }))
        .pipe(gulp.dest('dist/img'))
})

// start task "server" and watch for file changes
gulp.task('watch', ['clean'], () => {
    gulp.start(['server', 'css', 'img'])

    gulp.watch('src/sass/**', ['css'])
    gulp.watch('src/img/**', ['img'])
})

// start tasks "css" and "img"
gulp.task('default', ['clean'], () => gulp.start(['css', 'img']))