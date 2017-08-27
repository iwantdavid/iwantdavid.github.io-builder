var browserSync  = require('browser-sync');
var watchify     = require('watchify');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');
var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpSequence = require('gulp-sequence');
var processhtml  = require('gulp-jade');
var compass      = require('gulp-compass');
var watch        = require('gulp-watch');
var minifycss    = require('gulp-minify-css');
var uglify       = require('gulp-uglify');
var streamify    = require('gulp-streamify');
var prod         = gutil.env.prod;

var onError = function(err) {
  console.log(err.message);
  this.emit('end');
};

// bundling js with browserify and watchify
var b = watchify(browserify('./src/js/main', {
  cache: {},
  packageCache: {},
  fullPaths: true
}));

gulp.task('js', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle() {
  return b.bundle()
    .on('error', onError)
    .pipe(source('bundle.js'))
    .pipe(prod ? streamify(uglify()) : gutil.noop())
    .pipe(gulp.dest('./build/script'))
    .pipe(browserSync.stream());
}

// html
gulp.task('html', function() {
  return gulp.src(['./src/template/**/*.jade', '!./src/template/include/*'])
    .pipe(processhtml())
    .pipe(gulp.dest('build'))
    .pipe(browserSync.stream());
});

// sass
gulp.task('sass', function() {
  gulp.src('./src/style/**/*.scss')
    .pipe(compass({
      config_file: './config.rb',
      css: 'build/style',
      sass: 'src/style'
    }))
    .on('error', onError)
    .pipe(prod ? minifycss() : gutil.noop())
    .pipe(gulp.dest('./build/style'))
    .pipe(browserSync.stream());
});

// Images
gulp.task('image', function() {
  gulp.src('./src/image/*')
    .pipe(gulp.dest('./build/image'));
});

// Files
gulp.task('file', function() {
  gulp.src('./src/file/**')
    .pipe(gulp.dest('./build/file'));
});

// browser sync server for live reload
gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: './build'
    }
  });

  gulp.watch('./src/template/**/*', ['html']);
  gulp.watch('./src/style/**/*.scss', ['sass']);
});

// use gulp-sequence to finish building html, sass and js before first page load
gulp.task('default', gulpSequence(['html', 'sass', 'js'], 'serve'));
