<?php
return new class extends Migration {
    function up() {
        Schema::create('users', function($t) {
            $t->string('a'); $t->string('b'); $t->string('keep');
        });
    }
};
