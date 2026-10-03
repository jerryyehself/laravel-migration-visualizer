<?php
return new class extends Migration {
  public function up() {
    Schema::create('users', function ($t) {
      $t->string('a');
      $t->string('b');
      $t->unique(['b', 'a'], 'old');
    });
  }
};
