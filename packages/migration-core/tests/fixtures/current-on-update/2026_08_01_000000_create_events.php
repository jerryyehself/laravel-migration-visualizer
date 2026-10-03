<?php
return new class extends Migration {
  public function up() {
    Schema::create('events', function ($t) {
      $t->timestamp('at', 6)->nullable()->default(null)->comment('seed')->index();
    });
  }
};
