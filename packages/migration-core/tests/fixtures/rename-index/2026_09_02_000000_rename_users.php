<?php
return new class extends Migration {
  public function up() {
    Schema::table('users', function ($t) {
      $t->renameIndex('old', 'new');
    });
  }
};
