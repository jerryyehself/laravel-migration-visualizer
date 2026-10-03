<?php
return new class extends Migration {
  public function up() {
    Schema::table('events', function ($t) {
      $t->timestamp('at', 6)->nullable()->default(null)->comment('seed')->change();
      $t->dateTimeTz('zoned', 3)->change();
    });
  }
};
