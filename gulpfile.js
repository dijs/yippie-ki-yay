var gulp = require('gulp');
var babel = require('gulp-babel');
var watch = require('gulp-watch');
var batch = require('gulp-batch');

gulp.task('compile', function () {
  return gulp.src('src/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
})

gulp.task('default', ['compile'], function () {
  watch('src/*.js', batch(function (events, done) {
    gulp.start('compile', done);
  }));
});
