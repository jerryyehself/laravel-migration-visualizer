<?php
return new class extends Migration {
    function up() {
        Schema::table('posts', function($t) {
            $t->string('later');
        });
    }
};
