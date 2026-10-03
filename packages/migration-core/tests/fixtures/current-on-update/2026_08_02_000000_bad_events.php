<?php
return new class extends Migration {
  public function up() {
    Schema::table('events', function ($t) {
      $t->dateTime('partial')->useCurrentOnUpdate();
      $t->timestamp('at', 6)->default(null)->useCurrentOnUpdate()->useCurrent()->change();
    });
  }
};
